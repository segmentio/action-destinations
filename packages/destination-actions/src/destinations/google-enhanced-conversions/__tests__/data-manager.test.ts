import nock from 'nock'
import { createTestIntegration, createTestEvent, createRequestClient } from '@segment/actions-core'
import { RetryableError, PayloadValidationError, IntegrationError } from '@segment/actions-core'
import Destination from '../index'
import {
  API_VERSION,
  DATA_MANAGER_BASE_URL,
  FLAGON_NAME_DATA_MANAGER_API,
  throwDataManagerError,
  exchangeForAccessToken,
  createDataManagerPartnerLink,
  createDataManagerUserList,
  getDataManagerUserList,
  ingestAudienceMembers,
  removeAudienceMembers,
  handleDataManagerUpdate,
  handleDataManagerBatchUpdate,
  getDataManagerListIds
} from '../functions'
import type { CreateAudienceInput } from '../types'
import type { Payload as UserListPayload } from '../userList/generated-types'

const testDestination = createTestIntegration(Destination)
const requestClient = createRequestClient()

const customerId = '1234567890'
const loginCustomerId = '9876543210'
const refreshToken = 'refresh-xyz'
const accessToken = 'access-abc'

// Reused from the legacy CONTACT_INFO tests in userList.test.ts so the hashes below are known-correct.
const HASHED_EMAIL = '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674' // test@gmail.com
const HASHED_PHONE = '0506a1f3f4c515fd310fce54d253b731f71e33e7e7d2b10848528ca4411120b0' // 3234567890 (+1)
const HASHED_FIRST_NAME = '4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332' // Jane
const HASHED_LAST_NAME = 'fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7' // Doe

const contactInfoPayload = (overrides: Partial<UserListPayload> = {}): UserListPayload => ({
  email: 'test@gmail.com',
  phone: '3234567890',
  first_name: 'Jane',
  last_name: 'Doe',
  country_code: 'US',
  postal_code: '982004',
  ad_user_data_consent_state: 'GRANTED',
  ad_personalization_consent_state: 'GRANTED',
  ...overrides
})

const mockStatsContext = () => ({
  statsClient: { incr: jest.fn(), histogram: jest.fn(), set: jest.fn() } as any,
  tags: [] as string[]
})

beforeEach(() => {
  nock.cleanAll()
  process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID = 'client-id'
  process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET = 'client-secret'
})

afterEach(() => {
  nock.cleanAll()
})

describe('throwDataManagerError', () => {
  it('rethrows the raw error when the response has no parseable Data Manager error body', () => {
    const networkError = new Error('ECONNRESET')
    expect(() => throwDataManagerError(networkError)).toThrow(networkError)
  })

  it('throws a RetryableError with status 500 for a retryable gRPC status, formatting field violations and requestId into the message', () => {
    const err = {
      response: {
        status: 503,
        data: {
          error: {
            code: 503,
            message: 'Service temporarily unavailable.',
            status: 'UNAVAILABLE',
            details: [
              {
                '@type': 'type.googleapis.com/google.rpc.BadRequest',
                fieldViolations: [{ field: 'audienceMembers[0].userData', description: 'is malformed' }]
              },
              { '@type': 'type.googleapis.com/google.rpc.RequestInfo', requestId: 'req-123' }
            ]
          }
        }
      }
    }

    let thrown: unknown
    try {
      throwDataManagerError(err)
    } catch (e) {
      thrown = e
    }

    expect(thrown).toBeInstanceOf(RetryableError)
    expect((thrown as RetryableError).status).toBe(500)
    expect((thrown as RetryableError).message).toBe(
      'Service temporarily unavailable. audienceMembers[0].userData: is malformed (requestId: req-123)'
    )
  })

  it('throws a PayloadValidationError for INVALID_ARGUMENT', () => {
    const err = {
      response: {
        status: 400,
        data: { error: { code: 400, message: 'Bad request.', status: 'INVALID_ARGUMENT' } }
      }
    }

    expect(() => throwDataManagerError(err)).toThrow(PayloadValidationError)
    expect(() => throwDataManagerError(err)).toThrow('Bad request.')
  })

  it('throws an IntegrationError with code PERMISSION_DENIED', () => {
    const err = {
      response: {
        status: 403,
        data: { error: { code: 403, message: 'Not authorized.', status: 'PERMISSION_DENIED' } }
      }
    }

    let thrown: unknown
    try {
      throwDataManagerError(err)
    } catch (e) {
      thrown = e
    }

    expect(thrown).toBeInstanceOf(IntegrationError)
    expect((thrown as IntegrationError).code).toBe('PERMISSION_DENIED')
    expect((thrown as IntegrationError).status).toBe(403)
  })

  it('falls back to a generic IntegrationError using the Data Manager status as the error code', () => {
    const err = {
      response: {
        status: 412,
        data: { error: { code: 412, message: 'Precondition failed.', status: 'FAILED_PRECONDITION' } }
      }
    }

    let thrown: unknown
    try {
      throwDataManagerError(err)
    } catch (e) {
      thrown = e
    }

    expect(thrown).toBeInstanceOf(IntegrationError)
    expect((thrown as IntegrationError).code).toBe('FAILED_PRECONDITION')
    expect((thrown as IntegrationError).status).toBe(412)
  })

  it('uses the HTTP response status when the error body has no numeric code', () => {
    const err = {
      response: {
        status: 409,
        data: { error: { message: 'Conflict.', status: 'ABORTED_BUT_NOT_RETRYABLE_LABEL' } }
      }
    }

    let thrown: unknown
    try {
      throwDataManagerError(err)
    } catch (e) {
      thrown = e
    }

    expect(thrown).toBeInstanceOf(IntegrationError)
    expect((thrown as IntegrationError).status).toBe(409)
  })
})

describe('exchangeForAccessToken', () => {
  it('exchanges a refresh token for an access token', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token', (body) => body.refresh_token === refreshToken)
      .reply(200, { access_token: accessToken })

    const result = await exchangeForAccessToken(requestClient, refreshToken)
    expect(result).toBe(accessToken)
  })

  it('throws PayloadValidationError when OAuth client credentials are not configured', async () => {
    delete process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID
    delete process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET

    await expect(exchangeForAccessToken(requestClient, refreshToken)).rejects.toThrow(PayloadValidationError)
  })
})

describe('createDataManagerPartnerLink', () => {
  it('creates a partner link for a directly-managed account', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`, {
        owningAccount: { accountId: customerId, accountType: 'GOOGLE_ADS' },
        partnerAccount: { accountId: '262932431', accountType: 'DATA_PARTNER' }
      })
      .matchHeader('authorization', `Bearer ${accessToken}`)
      .matchHeader('login-account', `accountTypes/GOOGLE_ADS/accounts/${customerId}`)
      .reply(200, {
        name: `accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks/1`,
        partnerLinkId: '1',
        owningAccount: { accountId: customerId, accountType: 'GOOGLE_ADS' },
        partnerAccount: { accountId: '262932431', accountType: 'DATA_PARTNER' }
      })

    const result = await createDataManagerPartnerLink(requestClient, customerId, accessToken)
    expect(result.partnerLinkId).toBe('1')
  })

  it('uses the MCC login customer id as the owning account when provided', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`, {
        owningAccount: { accountId: loginCustomerId, accountType: 'GOOGLE_ADS' },
        partnerAccount: { accountId: '262932431', accountType: 'DATA_PARTNER' }
      })
      .matchHeader('login-account', `accountTypes/GOOGLE_ADS/accounts/${loginCustomerId}`)
      .reply(200, {
        name: 'link',
        partnerLinkId: '2',
        owningAccount: { accountId: loginCustomerId, accountType: 'GOOGLE_ADS' },
        partnerAccount: { accountId: '262932431', accountType: 'DATA_PARTNER' }
      })

    const result = await createDataManagerPartnerLink(requestClient, customerId, accessToken, loginCustomerId)
    expect(result.partnerLinkId).toBe('2')
  })

  it('treats a 409 ALREADY_EXISTS response as success', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`)
      .reply(409, { error: { code: 409, message: 'Link already exists.', status: 'ALREADY_EXISTS' } })

    const result = await createDataManagerPartnerLink(requestClient, customerId, accessToken)
    expect(result).toMatchObject({ error: { status: 'ALREADY_EXISTS' } })
  })

  it('propagates non-409 errors via throwDataManagerError', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`)
      .reply(400, { error: { code: 400, message: 'Bad request.', status: 'INVALID_ARGUMENT' } })

    await expect(createDataManagerPartnerLink(requestClient, customerId, accessToken)).rejects.toThrow(
      PayloadValidationError
    )
  })
})

describe('createDataManagerUserList', () => {
  const baseInput = (overrides: Partial<CreateAudienceInput> = {}): CreateAudienceInput => ({
    audienceName: 'My List',
    settings: { customerId },
    audienceSettings: { external_id_type: 'CONTACT_INFO' },
    ...overrides
  })

  it('creates a CONTACT_INFO user list', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })

    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`, {
        displayName: 'My List',
        membershipDuration: '46656000s',
        ingestedUserListInfo: { uploadKeyTypes: ['CONTACT_ID'] }
      })
      .matchHeader('authorization', `Bearer ${accessToken}`)
      .reply(200, { name: 'userList', id: 'dm-list-1', displayName: 'My List' })

    const result = await createDataManagerUserList(requestClient, baseInput(), { refresh_token: refreshToken })
    expect(result).toBe('dm-list-1')
  })

  it('creates a CRM_ID user list using the USER_ID upload key type', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })

    nock(DATA_MANAGER_BASE_URL)
      .post(
        `/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`,
        (body) => body.ingestedUserListInfo?.uploadKeyTypes?.[0] === 'USER_ID'
      )
      .reply(200, { name: 'userList', id: 'dm-list-2' })

    const result = await createDataManagerUserList(
      requestClient,
      baseInput({ audienceSettings: { external_id_type: 'CRM_ID' } }),
      { refresh_token: refreshToken }
    )
    expect(result).toBe('dm-list-2')
  })

  it('creates a MOBILE_ADVERTISING_ID user list with mobileIdInfo using the MOBILE_ID upload key type', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })

    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`, {
        displayName: 'My List',
        membershipDuration: '46656000s',
        ingestedUserListInfo: { uploadKeyTypes: ['MOBILE_ID'], mobileIdInfo: { appId: 'com.segment.app' } }
      })
      .reply(200, { name: 'userList', id: 'dm-list-3' })

    const result = await createDataManagerUserList(
      requestClient,
      baseInput({ audienceSettings: { external_id_type: 'MOBILE_ADVERTISING_ID', app_id: 'com.segment.app' } }),
      { refresh_token: refreshToken }
    )
    expect(result).toBe('dm-list-3')
  })

  it('sends a login-account header derived from loginCustomerId', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })

    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`)
      .matchHeader('login-account', `accountTypes/GOOGLE_ADS/accounts/${loginCustomerId}`)
      .reply(200, { name: 'userList', id: 'dm-list-4' })

    const result = await createDataManagerUserList(
      requestClient,
      baseInput({ settings: { customerId, loginCustomerId } }),
      { refresh_token: refreshToken }
    )
    expect(result).toBe('dm-list-4')
  })

  it('throws PayloadValidationError when MOBILE_ADVERTISING_ID is selected without an app_id', async () => {
    await expect(
      createDataManagerUserList(
        requestClient,
        baseInput({ audienceSettings: { external_id_type: 'MOBILE_ADVERTISING_ID' } }),
        { refresh_token: refreshToken }
      )
    ).rejects.toThrow('App ID is required when external ID type is mobile advertising ID.')
  })

  it('throws PayloadValidationError when the refresh token is missing', async () => {
    await expect(createDataManagerUserList(requestClient, baseInput(), {})).rejects.toThrow(PayloadValidationError)
  })

  it('throws PayloadValidationError when the OAuth client credentials are not configured', async () => {
    delete process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID

    await expect(
      createDataManagerUserList(requestClient, baseInput(), { refresh_token: refreshToken })
    ).rejects.toThrow(PayloadValidationError)
  })

  it('throws IntegrationError when the Data Manager response has no user list id', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })

    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`)
      .reply(200, { name: 'userList' })

    await expect(
      createDataManagerUserList(requestClient, baseInput(), { refresh_token: refreshToken })
    ).rejects.toThrow('Failed to receive a created user list id from Data Manager.')
  })

  it('converts a failed create call into a Data Manager error and increments the error stat', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })

    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`)
      .reply(400, { error: { code: 400, message: 'Bad request.', status: 'INVALID_ARGUMENT' } })

    const statsContext = mockStatsContext()
    await expect(
      createDataManagerUserList(requestClient, baseInput(), { refresh_token: refreshToken }, statsContext)
    ).rejects.toThrow(PayloadValidationError)
    expect(statsContext.statsClient.incr).toHaveBeenCalledWith('createDataManagerAudience.error', 1, statsContext.tags)
  })
})

describe('getDataManagerUserList', () => {
  it('fetches an existing user list', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })

    nock(DATA_MANAGER_BASE_URL)
      .get(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists/dm-list-1`)
      .matchHeader('authorization', `Bearer ${accessToken}`)
      .reply(200, { name: 'userList', id: 'dm-list-1', displayName: 'My List' })

    const result = await getDataManagerUserList(requestClient, { customerId }, 'dm-list-1', {
      refresh_token: refreshToken
    })
    expect(result).toMatchObject({ id: 'dm-list-1', displayName: 'My List' })
  })

  it('throws PayloadValidationError when the refresh token is missing', async () => {
    await expect(getDataManagerUserList(requestClient, { customerId }, 'dm-list-1', {})).rejects.toThrow(
      PayloadValidationError
    )
  })

  it('throws IntegrationError when the Data Manager response has no user list id', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })

    nock(DATA_MANAGER_BASE_URL)
      .get(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists/dm-list-1`)
      .reply(200, { name: 'userList' })

    await expect(
      getDataManagerUserList(requestClient, { customerId }, 'dm-list-1', { refresh_token: refreshToken })
    ).rejects.toThrow('Failed to retrieve user list from Data Manager.')
  })
})

describe('ingestAudienceMembers', () => {
  it('POSTs to audienceMembers:ingest with the built destination and terms of service acceptance', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:ingest', {
        destinations: [
          {
            loginAccount: { accountId: customerId, accountType: 'GOOGLE_ADS' },
            operatingAccount: { accountId: customerId, accountType: 'GOOGLE_ADS' },
            productDestinationId: 'dm-list-1'
          }
        ],
        audienceMembers: [{ userIdData: { userId: 'user-1' } }],
        encoding: 'HEX',
        termsOfService: { customerMatchTermsOfServiceStatus: 'ACCEPTED' }
      })
      .reply(200, { requestId: 'req-1' })

    const result = await ingestAudienceMembers(requestClient, customerId, 'dm-list-1', [
      { userIdData: { userId: 'user-1' } }
    ])
    expect(result).toEqual({ requestId: 'req-1' })
  })

  it('includes linkedAccount in the destination and uses the customer access token when a login customer id is set', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:ingest', (body) => {
        const dest = body.destinations[0]
        return (
          dest.loginAccount.accountId === loginCustomerId &&
          dest.linkedAccount?.accountId === customerId &&
          dest.operatingAccount.accountId === customerId
        )
      })
      .matchHeader('authorization', `Bearer ${accessToken}`)
      .reply(200, { requestId: 'req-2' })

    const result = await ingestAudienceMembers(
      requestClient,
      customerId,
      'dm-list-1',
      [{ userIdData: { userId: 'user-1' } }],
      loginCustomerId,
      accessToken
    )
    expect(result).toEqual({ requestId: 'req-2' })
  })

  it('increments a fieldWarnings stat when the response carries non-fatal warnings', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:ingest')
      .reply(200, { requestId: 'req-3', fieldWarnings: [{ field: 'userData', description: 'ignored field' }] })

    const statsContext = mockStatsContext()
    await ingestAudienceMembers(
      requestClient,
      customerId,
      'dm-list-1',
      [{ userIdData: { userId: 'user-1' } }],
      undefined,
      undefined,
      statsContext
    )

    expect(statsContext.statsClient.incr).toHaveBeenCalledWith('dataManagerIngest.fieldWarnings', 1, statsContext.tags)
    expect(statsContext.statsClient.incr).toHaveBeenCalledWith('dataManagerIngest.success', 1, statsContext.tags)
  })

  it('converts a failed ingest call into a Data Manager error and increments the error stat', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:ingest')
      .reply(503, { error: { code: 503, message: 'Unavailable.', status: 'UNAVAILABLE' } })

    const statsContext = mockStatsContext()
    await expect(
      ingestAudienceMembers(
        requestClient,
        customerId,
        'dm-list-1',
        [{ userIdData: { userId: 'user-1' } }],
        undefined,
        undefined,
        statsContext
      )
    ).rejects.toThrow(RetryableError)
    expect(statsContext.statsClient.incr).toHaveBeenCalledWith('dataManagerIngest.error', 1, statsContext.tags)
  })
})

describe('removeAudienceMembers', () => {
  it('POSTs to audienceMembers:remove without terms of service', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:remove', (body) => !('termsOfService' in body) && body.encoding === 'HEX')
      .reply(200, { requestId: 'req-4' })

    const result = await removeAudienceMembers(requestClient, customerId, 'dm-list-1', [
      { userIdData: { userId: 'user-1' } }
    ])
    expect(result).toEqual({ requestId: 'req-4' })
  })

  it('converts a failed remove call into a Data Manager error and increments the error stat', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:remove')
      .reply(400, { error: { code: 400, message: 'Bad request.', status: 'INVALID_ARGUMENT' } })

    const statsContext = mockStatsContext()
    await expect(
      removeAudienceMembers(
        requestClient,
        customerId,
        'dm-list-1',
        [{ userIdData: { userId: 'user-1' } }],
        undefined,
        undefined,
        statsContext
      )
    ).rejects.toThrow(PayloadValidationError)
    expect(statsContext.statsClient.incr).toHaveBeenCalledWith('dataManagerRemove.error', 1, statsContext.tags)
  })
})

describe('handleDataManagerUpdate', () => {
  const settings = { customerId }
  const audienceSettings = { external_id_type: 'CONTACT_INFO' }

  it('throws PayloadValidationError when no external audience id can be resolved', async () => {
    await expect(
      handleDataManagerUpdate(requestClient, settings, audienceSettings, [contactInfoPayload()], '', '')
    ).rejects.toThrow('External Audience ID is required.')
  })

  it('sends a CONTACT_INFO member via audienceMembers:ingest for an "Audience Entered" event', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:ingest', (body) => {
        const identifiers = body.audienceMembers[0].userData.userIdentifiers
        return (
          identifiers.some((i: Record<string, unknown>) => i.emailAddress === HASHED_EMAIL) &&
          identifiers.some((i: Record<string, unknown>) => i.phoneNumber === HASHED_PHONE) &&
          identifiers.some(
            (i: Record<string, unknown>) =>
              (i.address as Record<string, unknown>)?.givenName === HASHED_FIRST_NAME &&
              (i.address as Record<string, unknown>)?.familyName === HASHED_LAST_NAME &&
              (i.address as Record<string, unknown>)?.regionCode === 'US' &&
              (i.address as Record<string, unknown>)?.postalCode === '982004'
          )
        )
      })
      .reply(200, { requestId: 'req-5' })

    const payload = contactInfoPayload({ event_name: 'Audience Entered' })
    const results = await handleDataManagerUpdate(
      requestClient,
      settings,
      audienceSettings,
      [payload],
      'dm-list-1',
      'CONTACT_INFO'
    )

    expect(results).toEqual([{ requestId: 'req-5' }])
  })

  it('sends a member via audienceMembers:remove for an "Audience Exited" event', async () => {
    nock(DATA_MANAGER_BASE_URL).post('/audienceMembers:remove').reply(200, { requestId: 'req-6' })

    const payload = contactInfoPayload({ event_name: 'Audience Exited' })
    const results = await handleDataManagerUpdate(
      requestClient,
      settings,
      audienceSettings,
      [payload],
      'dm-list-1',
      'CONTACT_INFO'
    )

    expect(results).toEqual([{ requestId: 'req-6' }])
  })

  it('treats syncMode "add" as an add regardless of event name', async () => {
    nock(DATA_MANAGER_BASE_URL).post('/audienceMembers:ingest').reply(200, { requestId: 'req-7' })

    const payload = contactInfoPayload({ event_name: 'Some Other Event' })
    const results = await handleDataManagerUpdate(
      requestClient,
      settings,
      audienceSettings,
      [payload],
      'dm-list-1',
      'CONTACT_INFO',
      'add'
    )

    expect(results).toEqual([{ requestId: 'req-7' }])
  })

  it('treats syncMode "delete" as a remove regardless of event name', async () => {
    nock(DATA_MANAGER_BASE_URL).post('/audienceMembers:remove').reply(200, { requestId: 'req-8' })

    const payload = contactInfoPayload({ event_name: 'Some Other Event' })
    const results = await handleDataManagerUpdate(
      requestClient,
      settings,
      audienceSettings,
      [payload],
      'dm-list-1',
      'CONTACT_INFO',
      'delete'
    )

    expect(results).toEqual([{ requestId: 'req-8' }])
  })

  it('in "mirror" syncMode, treats new/updated as add and deleted as remove, sending one ingest call and one remove call', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:ingest', (body) => body.audienceMembers.length === 2)
      .reply(200, { requestId: 'req-9' })

    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:remove', (body) => body.audienceMembers.length === 1)
      .reply(200, { requestId: 'req-10' })

    const payloads = [
      contactInfoPayload({ email: 'a@gmail.com', event_name: 'new' }),
      contactInfoPayload({ email: 'b@gmail.com', event_name: 'updated' }),
      contactInfoPayload({ email: 'c@gmail.com', event_name: 'deleted' })
    ]

    const results = await handleDataManagerUpdate(
      requestClient,
      settings,
      audienceSettings,
      payloads,
      'dm-list-1',
      'CONTACT_INFO',
      'mirror'
    )

    expect(results).toEqual([{ requestId: 'req-9' }, { requestId: 'req-10' }])
  })

  it('uses the resolved audienceMembership boolean to classify add vs. remove when event name/syncMode do not match', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:ingest', (body) => body.audienceMembers.length === 1)
      .reply(200, { requestId: 'req-11' })

    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:remove', (body) => body.audienceMembers.length === 1)
      .reply(200, { requestId: 'req-12' })

    const payloads = [
      contactInfoPayload({ email: 'a@gmail.com', event_name: 'Custom Event' }),
      contactInfoPayload({ email: 'b@gmail.com', event_name: 'Custom Event' })
    ]

    const results = await handleDataManagerUpdate(
      requestClient,
      settings,
      audienceSettings,
      payloads,
      'dm-list-1',
      'CONTACT_INFO',
      undefined,
      undefined,
      undefined,
      [true, false]
    )

    expect(results).toEqual([{ requestId: 'req-11' }, { requestId: 'req-12' }])
  })

  it('sends a CRM_ID member as userIdData', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:ingest', (body) => body.audienceMembers[0].userIdData?.userId === 'crm-42')
      .reply(200, { requestId: 'req-13' })

    const payload: UserListPayload = {
      crm_id: 'crm-42',
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      event_name: 'Audience Entered'
    }

    const results = await handleDataManagerUpdate(
      requestClient,
      settings,
      { external_id_type: 'CRM_ID' },
      [payload],
      'dm-list-1',
      'CRM_ID'
    )

    expect(results).toEqual([{ requestId: 'req-13' }])
  })

  it('sends a MOBILE_ADVERTISING_ID member as mobileData', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:ingest', (body) => body.audienceMembers[0].mobileData?.mobileIds?.[0] === 'mobile-42')
      .reply(200, { requestId: 'req-14' })

    const payload: UserListPayload = {
      mobile_advertising_id: 'mobile-42',
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      event_name: 'Audience Entered'
    }

    const results = await handleDataManagerUpdate(
      requestClient,
      settings,
      { external_id_type: 'MOBILE_ADVERTISING_ID' },
      [payload],
      'dm-list-1',
      'MOBILE_ADVERTISING_ID'
    )

    expect(results).toEqual([{ requestId: 'req-14' }])
  })

  it('skips a payload with no usable identifiers and makes no Data Manager call', async () => {
    const payload: UserListPayload = {
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      event_name: 'Audience Entered'
    }

    const results = await handleDataManagerUpdate(
      requestClient,
      settings,
      audienceSettings,
      [payload],
      'dm-list-1',
      'CONTACT_INFO'
    )

    expect(results).toEqual([])
    expect(nock.pendingMocks()).toEqual([])
  })

  it('maps GRANTED/DENIED consent states to CONSENT_GRANTED/CONSENT_DENIED', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post(
        '/audienceMembers:ingest',
        (body) =>
          body.audienceMembers[0].consent.adUserData === 'CONSENT_GRANTED' &&
          body.audienceMembers[0].consent.adPersonalization === 'CONSENT_DENIED'
      )
      .reply(200, { requestId: 'req-15' })

    const payload = contactInfoPayload({
      event_name: 'Audience Entered',
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'DENIED'
    })

    const results = await handleDataManagerUpdate(
      requestClient,
      settings,
      audienceSettings,
      [payload],
      'dm-list-1',
      'CONTACT_INFO'
    )

    expect(results).toEqual([{ requestId: 'req-15' }])
  })
})

describe('handleDataManagerBatchUpdate', () => {
  const settings = { customerId }
  const audienceSettings = { external_id_type: 'CONTACT_INFO' }

  it('throws PayloadValidationError when no external audience id can be resolved', async () => {
    await expect(
      handleDataManagerBatchUpdate(requestClient, settings, audienceSettings, [contactInfoPayload()], '', '')
    ).rejects.toThrow('External Audience ID is required.')
  })

  it('marks a payload with no usable identifiers as a PAYLOAD_VALIDATION_FAILED error at its index', async () => {
    const emptyPayload: UserListPayload = {
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      event_name: 'Audience Entered'
    }

    const result = await handleDataManagerBatchUpdate(
      requestClient,
      settings,
      audienceSettings,
      [emptyPayload],
      'dm-list-1',
      'CONTACT_INFO'
    )

    expect(result.isErrorResponseAtIndex(0)).toBe(true)
    expect(result.getResponseAtIndex(0).value()).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'Missing or invalid data for CONTACT_INFO.'
    })
  })

  it('marks a payload whose operation type cannot be determined as an error at its index', async () => {
    const payload = contactInfoPayload({ event_name: 'Unrecognized Event' })

    const result = await handleDataManagerBatchUpdate(
      requestClient,
      settings,
      audienceSettings,
      [payload],
      'dm-list-1',
      'CONTACT_INFO'
    )

    expect(result.getResponseAtIndex(0).value()).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'Could not determine Operation Type.'
    })
  })

  it('reports a success MultiStatusResponse entry per index for add and remove payloads', async () => {
    nock(DATA_MANAGER_BASE_URL).post('/audienceMembers:ingest').reply(200, { requestId: 'req-16' })

    nock(DATA_MANAGER_BASE_URL).post('/audienceMembers:remove').reply(200, { requestId: 'req-17' })

    const payloads = [
      contactInfoPayload({ email: 'a@gmail.com', event_name: 'Audience Entered' }),
      contactInfoPayload({ email: 'b@gmail.com', event_name: 'Audience Exited' })
    ]

    const result = await handleDataManagerBatchUpdate(
      requestClient,
      settings,
      audienceSettings,
      payloads,
      'dm-list-1',
      'CONTACT_INFO'
    )

    expect(result.getResponseAtIndex(0).value()).toMatchObject({ status: 200, body: { requestId: 'req-16' } })
    expect(result.getResponseAtIndex(1).value()).toMatchObject({ status: 200, body: { requestId: 'req-17' } })
  })

  it('marks every entry in a failed batch call as an error using the thrown error status/message', async () => {
    nock(DATA_MANAGER_BASE_URL)
      .post('/audienceMembers:ingest')
      .reply(503, { error: { code: 503, message: 'Service unavailable.', status: 'UNAVAILABLE' } })

    const payloads = [
      contactInfoPayload({ email: 'a@gmail.com', event_name: 'Audience Entered' }),
      contactInfoPayload({ email: 'b@gmail.com', event_name: 'Audience Entered' })
    ]

    const result = await handleDataManagerBatchUpdate(
      requestClient,
      settings,
      audienceSettings,
      payloads,
      'dm-list-1',
      'CONTACT_INFO'
    )

    expect(result.isErrorResponseAtIndex(0)).toBe(true)
    expect(result.getResponseAtIndex(0).value()).toMatchObject({ status: 500, errormessage: 'Service unavailable.' })
    expect(result.isErrorResponseAtIndex(1)).toBe(true)
    expect(result.getResponseAtIndex(1).value()).toMatchObject({ status: 500, errormessage: 'Service unavailable.' })
  })
})

describe('getDataManagerListIds', () => {
  it('returns dynamic field choices built from the returned user lists', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })
    nock(DATA_MANAGER_BASE_URL).post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`).reply(200, {})
    nock(DATA_MANAGER_BASE_URL)
      .get(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`)
      .reply(200, {
        userLists: [
          { id: 'dm-list-1', name: 'n1', displayName: 'List One' },
          { id: 'dm-list-2', name: 'n2' }
        ],
        nextPageToken: 'page-2'
      })

    const result = await getDataManagerListIds(requestClient, { customerId }, { refresh_token: refreshToken })

    expect(result).toEqual({
      choices: [
        { value: 'dm-list-1', label: 'List One' },
        { value: 'dm-list-2', label: 'dm-list-2' }
      ],
      nextPage: 'page-2'
    })
  })

  it('still returns choices when the best-effort partner link creation fails', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })
    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`)
      .reply(500, { error: { code: 500, message: 'boom', status: 'INTERNAL' } })
    nock(DATA_MANAGER_BASE_URL)
      .get(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`)
      .reply(200, { userLists: [] })

    const result = await getDataManagerListIds(requestClient, { customerId }, { refresh_token: refreshToken })
    expect(result.choices).toEqual([])
  })

  it('returns an empty choice list with an error when the refresh token is missing', async () => {
    const result = await getDataManagerListIds(requestClient, { customerId }, {})
    expect(result.choices).toEqual([])
    expect(result.error).toMatchObject({ message: 'Oauth credentials missing.', code: '400' })
  })

  it('returns an empty choice list with an error when the list request fails', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })
    nock(DATA_MANAGER_BASE_URL).post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`).reply(200, {})
    nock(DATA_MANAGER_BASE_URL)
      .get(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`)
      .reply(403, { error: { code: 403, message: 'Not authorized.', status: 'PERMISSION_DENIED' } })

    const result = await getDataManagerListIds(requestClient, { customerId }, { refresh_token: refreshToken })
    expect(result.choices).toEqual([])
    expect(result.error).toMatchObject({ message: 'Not authorized.', code: '403' })
  })
})

describe('destination.createAudience with the Data Manager feature flag', () => {
  it('creates a Data Manager user list when the flag is ON', async () => {
    // Two separate token exchanges happen on this path: one for the best-effort partner
    // link bootstrap, and a second (duplicated) exchange inside createDataManagerUserList itself.
    nock('https://www.googleapis.com').post('/oauth2/v4/token').twice().reply(200, { access_token: accessToken })
    nock(DATA_MANAGER_BASE_URL).post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`).reply(200, {})
    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`)
      .reply(200, { name: 'userList', id: 'dm-list-9' })

    const result = await testDestination.createAudience({
      settings: { customerId, oauth: { refresh_token: refreshToken } },
      audienceName: 'My List',
      audienceSettings: { external_id_type: 'CONTACT_INFO' },
      features: { [FLAGON_NAME_DATA_MANAGER_API]: true }
    })

    expect(result).toEqual({ externalId: 'dm-list-9' })
  })

  it('falls back to the legacy Google Ads audience creation flow when the flag is OFF', async () => {
    process.env.ADWORDS_DEVELOPER_TOKEN = 'dev-token'
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })
    nock(`https://googleads.googleapis.com`)
      .post(`/${API_VERSION}/customers/${customerId}/userLists:mutate`)
      .reply(200, { results: [{ resourceName: `customers/${customerId}/userLists/legacy-1` }] })

    const result = await testDestination.createAudience({
      settings: { customerId, oauth: { refresh_token: refreshToken } },
      audienceName: 'My List',
      audienceSettings: { external_id_type: 'CONTACT_INFO' },
      features: {}
    })

    expect(result).toEqual({ externalId: 'legacy-1' })
    expect(nock.pendingMocks()).toEqual([])
  })
})

describe('destination.getAudience with the Data Manager feature flag', () => {
  it('fetches a Data Manager user list when the flag is ON', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken }).persist()
    nock(DATA_MANAGER_BASE_URL).post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`).reply(200, {})
    nock(DATA_MANAGER_BASE_URL)
      .get(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists/dm-list-9`)
      .reply(200, { name: 'userList', id: 'dm-list-9', displayName: 'My List' })

    const result = await testDestination.getAudience({
      settings: { customerId, oauth: { refresh_token: refreshToken } },
      audienceSettings: { external_id_type: 'CONTACT_INFO' },
      externalId: 'dm-list-9',
      features: { [FLAGON_NAME_DATA_MANAGER_API]: true }
    })

    expect(result).toEqual({ externalId: 'dm-list-9' })
    nock.cleanAll()
  })
})

describe('userList action perform/performBatch with the Data Manager feature flag ON', () => {
  const dataManagerFeatures = { [FLAGON_NAME_DATA_MANAGER_API]: true }

  it('perform() ingests a CONTACT_INFO member for an Audience Entered event', async () => {
    nock(DATA_MANAGER_BASE_URL).post('/audienceMembers:ingest').reply(200, { requestId: 'req-perform-1' })

    const event = createTestEvent({
      event: 'Audience Entered',
      properties: {
        email: 'test@gmail.com',
        phone: '3234567890',
        firstName: 'Jane',
        lastName: 'Doe',
        address: { postalCode: '982004' }
      },
      context: { location: { country: 'US' } }
    })

    const responses = await testDestination.testAction('userList', {
      event,
      mapping: {
        ad_user_data_consent_state: 'GRANTED',
        ad_personalization_consent_state: 'GRANTED',
        external_audience_id: 'dm-list-1',
        country_code: { '@path': '$.context.location.country' },
        postal_code: { '@path': '$.properties.address.postalCode' },
        retlOnMappingSave: { outputs: { id: 'dm-list-1', name: 'Test List', external_id_type: 'CONTACT_INFO' } }
      },
      useDefaultMappings: true,
      settings: { customerId },
      features: dataManagerFeatures
    })

    expect(responses.length).toBe(1)
    expect(responses[0].options.body).toContain(HASHED_EMAIL)
  })

  it('performBatch() returns a MultiStatusResponse handled through the Data Manager path', async () => {
    nock(DATA_MANAGER_BASE_URL).post('/audienceMembers:ingest').reply(200, { requestId: 'req-batch-1' })

    const events = [
      createTestEvent({
        event: 'Audience Entered',
        properties: { email: 'test@gmail.com', phone: '3234567890', firstName: 'Jane', lastName: 'Doe' }
      })
    ]

    const responses = await testDestination.executeBatch('userList', {
      events,
      mapping: {
        email: { '@path': '$.properties.email' },
        phone: { '@path': '$.properties.phone' },
        first_name: { '@path': '$.properties.firstName' },
        last_name: { '@path': '$.properties.lastName' },
        event_name: { '@path': '$.event' },
        ad_user_data_consent_state: 'GRANTED',
        ad_personalization_consent_state: 'GRANTED',
        external_audience_id: 'dm-list-1',
        retlOnMappingSave: { outputs: { id: 'dm-list-1', name: 'Test List', external_id_type: 'CONTACT_INFO' } }
      },
      settings: { customerId },
      features: dataManagerFeatures
    })

    expect(responses[0]).toMatchObject({ status: 200 })
  })
})

describe('retlOnMappingSave hook input "list_id" dynamic field with the Data Manager feature flag ON', () => {
  it('calls getDataManagerListIds instead of the legacy getListIds lookup', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken })
    nock(DATA_MANAGER_BASE_URL).post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`).reply(200, {})
    nock(DATA_MANAGER_BASE_URL)
      .get(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`)
      .reply(200, { userLists: [{ id: 'dm-list-1', name: 'n1', displayName: 'List One' }] })

    const listIdDynamicField = (Destination.actions.userList.hooks as any).retlOnMappingSave.inputFields.list_id.dynamic

    const responses = await listIdDynamicField(requestClient, {
      settings: { customerId },
      payload: {},
      auth: { refreshToken, accessToken },
      features: { [FLAGON_NAME_DATA_MANAGER_API]: true }
    })

    expect(responses.choices).toEqual([{ value: 'dm-list-1', label: 'List One' }])
  })
})

describe('userList retlOnMappingSave hook with the Data Manager feature flag ON', () => {
  const dataManagerFeatures = { [FLAGON_NAME_DATA_MANAGER_API]: true }

  it('creates a new Data Manager list when no list_id is provided', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken }).persist()
    nock(DATA_MANAGER_BASE_URL).post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`).reply(200, {})
    nock(DATA_MANAGER_BASE_URL)
      .post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`)
      .reply(200, { name: 'userList', id: 'dm-list-new' })

    const result = await testDestination.actions.userList.executeHook('retlOnMappingSave', {
      settings: { customerId },
      auth: { refreshToken, accessToken },
      hookInputs: { list_name: 'Test List', external_id_type: 'CONTACT_INFO' },
      payload: {},
      features: dataManagerFeatures
    })

    expect(result.successMessage).toContain('dm-list-new')
    expect(result.savedData).toMatchObject({ id: 'dm-list-new' })
    nock.cleanAll()
  })

  it('fetches an existing Data Manager list when list_id is provided', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(200, { access_token: accessToken }).persist()
    nock(DATA_MANAGER_BASE_URL).post(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`).reply(200, {})
    nock(DATA_MANAGER_BASE_URL)
      .get(`/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists/dm-list-existing`)
      .reply(200, { name: 'userList', id: 'dm-list-existing', displayName: 'Existing List' })

    const result = await testDestination.actions.userList.executeHook('retlOnMappingSave', {
      settings: { customerId },
      auth: { refreshToken, accessToken },
      hookInputs: { list_id: 'dm-list-existing', external_id_type: 'CONTACT_INFO' },
      payload: {},
      features: dataManagerFeatures
    })

    expect(result.successMessage).toContain('dm-list-existing')
    expect(result.savedData).toMatchObject({ id: 'dm-list-existing', name: 'Existing List' })
    nock.cleanAll()
  })
})
