import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import createRequestClient from '../../../../../../core/src/create-request-client'
import Destination from '../../index'
import * as audienceFunctions from '../../audience-functions'
import { performHook } from '../hook-functions'
import type { RetlOnMappingSaveInputs } from '../generated-types'

const ADVERTISER_ID = '12345'
const AUDIENCE_ID = '98765'
const DV360_HOST = 'https://displayvideo.googleapis.com'
const CREATE_PATH = `/v4/firstPartyAndPartnerAudiences?advertiserId=${ADVERTISER_ID}`
const GET_PATH = `/v4/firstPartyAndPartnerAudiences/${AUDIENCE_ID}?advertiserId=${ADVERTISER_ID}`

const request = createRequestClient()

const testDestination = createTestIntegration(Destination)

const inputs = (overrides: Partial<RetlOnMappingSaveInputs> = {}): RetlOnMappingSaveInputs =>
  ({
    operation: 'create',
    advertiserId: ADVERTISER_ID,
    audienceName: 'My Audience',
    audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
    membershipDurationDays: 90,
    ...overrides
  } as RetlOnMappingSaveInputs)

const hookError = (message: string) => ({ error: { message, code: 'RETL_ON_MAPPING_SAVE_FAILED' } })

afterEach(() => {
  nock.cleanAll()
  jest.restoreAllMocks()
})

describe('FirstPartyDv360.syncAudience retlOnMappingSave', () => {
  it('creates an audience and saves what perform needs', async () => {
    let body: any
    nock(DV360_HOST)
      .post(CREATE_PATH, (b) => {
        body = b
        return true
      })
      .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })

    const result = await performHook(request, inputs({ description: 'A description' }))

    expect(body).toEqual({
      displayName: 'My Audience',
      audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
      // Sent as a string: DV360 types this as an int64.
      membershipDurationDays: '90',
      description: 'A description',
      audienceSource: 'AUDIENCE_SOURCE_UNSPECIFIED',
      firstPartyAndPartnerAudienceType: 'TYPE_FIRST_PARTY'
    })
    expect(result).toEqual({
      successMessage: `Audience created with ID: ${AUDIENCE_ID}`,
      savedData: {
        audienceId: AUDIENCE_ID,
        advertiserId: ADVERTISER_ID,
        audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
        appId: undefined
      }
    })
  })

  it('connects to the audience when one with the same name already exists', async () => {
    nock(DV360_HOST)
      .post(CREATE_PATH)
      .reply(400, {
        error: {
          code: 400,
          message: 'The following display name already exists: "My Audience".',
          status: 'INVALID_ARGUMENT'
        }
      })
    nock(DV360_HOST)
      .get('/v4/firstPartyAndPartnerAudiences')
      .query({ advertiserId: ADVERTISER_ID, filter: 'displayName:"My Audience"' })
      .reply(200, {
        firstPartyAndPartnerAudiences: [
          {
            firstPartyAndPartnerAudienceId: AUDIENCE_ID,
            displayName: 'My Audience',
            audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
            membershipDurationDays: '90',
            firstPartyAndPartnerAudienceType: 'TYPE_FIRST_PARTY'
          }
        ]
      })

    const result = await performHook(request, inputs({ operation: 'create_or_connect' }))

    expect(result).toEqual({
      successMessage: `Connected to existing audience with ID: ${AUDIENCE_ID}`,
      savedData: {
        audienceId: AUDIENCE_ID,
        advertiserId: ADVERTISER_ID,
        audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
        appId: undefined
      }
    })
  })

  it('passes through the error message returned by Display & Video 360', async () => {
    nock(DV360_HOST)
      .post(CREATE_PATH)
      .reply(403, { error: { code: 403, message: 'The caller does not have permission', status: 'PERMISSION_DENIED' } })

    const result = await performHook(request, inputs())

    expect(result).toEqual(
      hookError('Failed to create audience in Display & Video 360: The caller does not have permission')
    )
  })

  // performHook is the only gate on these: the hook inputs are deliberately not marked
  // required, so that a missing value fails at mapping save with a message naming it
  // rather than blocking the mapping form. The full validation rules are tested against
  // validateAudienceInputs in audience-functions.test.ts; this proves the hook reports them.
  it.each(['create', 'existing'])('returns validation errors as a mapping save error (%s)', async (operation) => {
    const result = await performHook(request, inputs({ operation, advertiserId: undefined }))

    expect(result).toEqual(hookError('Missing advertiser ID value'))
  })

  it.each([undefined, 'nonsense'])('rejects an invalid operation (%p)', async (operation) => {
    const result = await performHook(request, inputs({ operation }))

    expect(result).toEqual(hookError('Invalid operation value. Must be create, create_or_connect or existing.'))
  })

  // Sent to DV360 as the audience's display name, so stray whitespace is the customer's to see.
  it('trims the audience name and description before creating', async () => {
    let body: any
    nock(DV360_HOST)
      .post(CREATE_PATH, (b) => {
        body = b
        return true
      })
      .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })

    await performHook(request, inputs({ audienceName: '  My Audience  ', description: '  A description  ' }))

    expect(body.displayName).toBe('My Audience')
    expect(body.description).toBe('A description')
  })

  it('connects to an existing audience whose type matches, saving its app ID', async () => {
    nock(DV360_HOST).get(GET_PATH).reply(200, {
      firstPartyAndPartnerAudienceId: AUDIENCE_ID,
      audienceType: 'CUSTOMER_MATCH_DEVICE_ID',
      appId: 'com.example.app'
    })

    const result = await performHook(
      request,
      inputs({
        operation: 'existing',
        existingAudienceId: AUDIENCE_ID,
        audienceName: undefined,
        audienceType: 'CUSTOMER_MATCH_DEVICE_ID'
      })
    )

    expect(result).toEqual({
      successMessage: `Connected to existing audience with ID: ${AUDIENCE_ID}`,
      savedData: {
        audienceId: AUDIENCE_ID,
        advertiserId: ADVERTISER_ID,
        audienceType: 'CUSTOMER_MATCH_DEVICE_ID',
        appId: 'com.example.app'
      }
    })
  })

  it('errors when the existing audience cannot be read', async () => {
    nock(DV360_HOST).get(GET_PATH).reply(404, {})

    const result = await performHook(
      request,
      inputs({ operation: 'existing', existingAudienceId: AUDIENCE_ID, audienceName: undefined })
    )

    expect(result).toEqual({
      error: {
        message: expect.stringContaining(`Failed to retrieve audience ${AUDIENCE_ID} from Display & Video 360:`),
        code: 'RETL_ON_MAPPING_SAVE_FAILED'
      }
    })
  })

  it('errors when the existing audience type does not match the Audience Type', async () => {
    nock(DV360_HOST)
      .get(GET_PATH)
      .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID, audienceType: 'CUSTOMER_MATCH_DEVICE_ID' })

    const result = await performHook(
      request,
      inputs({ operation: 'existing', existingAudienceId: AUDIENCE_ID, audienceName: undefined })
    )

    expect(result).toEqual({
      error: {
        message: expect.stringContaining(
          `Could not connect to the existing Display & Video 360 audience with ID "${AUDIENCE_ID}": its type is CUSTOMER_MATCH_DEVICE_ID, but the Audience Type setting is CUSTOMER_MATCH_CONTACT_INFO.`
        ),
        code: 'RETL_ON_MAPPING_SAVE_FAILED'
      }
    })
  })

  it('records stats under the retlCreateAudience name', async () => {
    nock(DV360_HOST).post(CREATE_PATH).reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })
    const incr = jest.fn()
    const statsContext = { statsClient: { incr }, tags: ['env:test'] } as unknown as StatsContext

    await performHook(request, inputs(), undefined, statsContext)

    expect(incr).toHaveBeenCalledWith('retlCreateAudience.call', 1, ['env:test', 'slug:actions-first-party-dv360'])
    expect(incr).toHaveBeenCalledWith('retlCreateAudience.success', 1, [
      'env:test',
      'slug:actions-first-party-dv360',
      'audience:created'
    ])
  })

  it.each([
    ['a string', 'boom', 'boom'],
    ['undefined', undefined, 'unknown error'],
    ['null', null, 'unknown error'],
    ['an object', { reason: 'bad' }, '{"reason":"bad"}']
  ])('returns a readable error when %s is thrown', async (_label: string, thrown: unknown, message: string) => {
    jest.spyOn(audienceFunctions, 'createOrConnectAudience').mockRejectedValueOnce(thrown)

    const result = await performHook(request, inputs())

    expect(result).toEqual(hookError(message))
  })
})

// The tests above call performHook with a bare request client, which cannot see the
// Authorization header the hook depends on: createOrConnectAudience is called with no
// token, so the header comes from the destination's extendRequest instead.
// executeHook builds the client the way core does, so these tests prove the token really
// reaches Display & Video 360 on the hook's own path.
describe('FirstPartyDv360.syncAudience retlOnMappingSave, through executeHook', () => {
  const auth = { accessToken: 'temp-token', refreshToken: 'refresh-token' }
  const executeHook = (hookInputs: RetlOnMappingSaveInputs) =>
    testDestination.actions.syncAudience.executeHook('retlOnMappingSave', {
      settings: {},
      auth,
      hookInputs,
      payload: {}
    })

  // The header is captured and asserted rather than matched on the interceptor: an unmatched
  // interceptor fails the request instead, which performHook turns into a mapping save error,
  // and the test would then fail on the result shape without naming the missing header.
  const captureAuthHeader = (body: Record<string, unknown>) => {
    const captured: { authorization?: string } = {}

    return {
      captured,
      // nock hands every header back as an array.
      reply: function (this: { req: { headers: Record<string, string | string[]> } }) {
        const header = this.req.headers.authorization

        captured.authorization = Array.isArray(header) ? header[0] : header
        return body
      }
    }
  }

  it('sends the access token when creating an audience', async () => {
    const { captured, reply } = captureAuthHeader({ firstPartyAndPartnerAudienceId: AUDIENCE_ID })
    nock(DV360_HOST).post(CREATE_PATH).reply(200, reply)

    const result = await executeHook(inputs())

    expect(captured.authorization).toBe(`Bearer ${auth.accessToken}`)
    expect(result).toMatchObject({ savedData: { audienceId: AUDIENCE_ID } })
  })

  it('sends the access token when connecting to an existing audience', async () => {
    const { captured, reply } = captureAuthHeader({
      firstPartyAndPartnerAudienceId: AUDIENCE_ID,
      audienceType: 'CUSTOMER_MATCH_CONTACT_INFO'
    })
    nock(DV360_HOST).get(GET_PATH).reply(200, reply)

    await executeHook(inputs({ operation: 'existing', existingAudienceId: AUDIENCE_ID, audienceName: undefined }))

    expect(captured.authorization).toBe(`Bearer ${auth.accessToken}`)
  })
})
