import nock from 'nock'
import { StatsContext } from '@segment/actions-core/destination-kit'
import createRequestClient from '../../../../../core/src/create-request-client'
import { createOrConnectAudience, getAudience, getAudienceByName, validateAudienceInputs } from '../audience-functions'
import type { AudienceInputs } from '../types'

const DV360_HOST = 'https://displayvideo.googleapis.com'
const ADVERTISER_ID = '12345'
const AUDIENCE_ID = '98765'
const AUDIENCE_NAME = 'Test Audience'
const CONTACT_INFO = 'CUSTOMER_MATCH_CONTACT_INFO'
const DEVICE_ID = 'CUSTOMER_MATCH_DEVICE_ID'
const CREATE_PATH = `/v4/firstPartyAndPartnerAudiences?advertiserId=${ADVERTISER_ID}`
const GET_PATH = `/v4/firstPartyAndPartnerAudiences/${AUDIENCE_ID}?advertiserId=${ADVERTISER_ID}`
const LIST_PATH = '/v4/firstPartyAndPartnerAudiences'

const request = createRequestClient()

const createInputs = (overrides: Partial<AudienceInputs> = {}): AudienceInputs => ({
  operation: 'create',
  advertiserId: ADVERTISER_ID,
  audienceName: AUDIENCE_NAME,
  audienceType: CONTACT_INFO,
  membershipDurationDays: '30',
  ...overrides
})

const existingInputs = (overrides: Partial<AudienceInputs> = {}): AudienceInputs => ({
  operation: 'existing',
  advertiserId: ADVERTISER_ID,
  audienceType: CONTACT_INFO,
  existingAudienceId: AUDIENCE_ID,
  ...overrides
})

const listQuery = (name = AUDIENCE_NAME, extra: Record<string, string> = {}) => ({
  advertiserId: ADVERTISER_ID,
  filter: `displayName:"${name}"`,
  ...extra
})

const firstParty = (overrides: Record<string, unknown> = {}) => ({
  firstPartyAndPartnerAudienceId: 'existing-id',
  displayName: AUDIENCE_NAME,
  audienceType: CONTACT_INFO,
  membershipDurationDays: '30',
  firstPartyAndPartnerAudienceType: 'TYPE_FIRST_PARTY',
  ...overrides
})

const nameExists = {
  error: {
    code: 400,
    message: `The following display name already exists: "${AUDIENCE_NAME}".`,
    status: 'INVALID_ARGUMENT'
  }
}

const options = { statsName: 'createAudience' }

const statsContextWith = () => {
  const incr = jest.fn()
  const statsContext = {
    statsClient: { incr, observe: jest.fn(), set: jest.fn(), histogram: jest.fn(), _name: jest.fn() },
    tags: ['env:test']
  } as unknown as StatsContext
  return { incr, statsContext }
}

afterEach(() => {
  nock.cleanAll()
})

describe('validateAudienceInputs', () => {
  it.each([undefined, '', '   '])('requires an advertiser ID (%p)', (advertiserId) => {
    expect(validateAudienceInputs(createInputs({ advertiserId }))).toEqual({
      error: 'Missing advertiser ID value',
      reason: 'missing-advertiser-id'
    })
    expect(validateAudienceInputs(existingInputs({ advertiserId }))).toEqual({
      error: 'Missing advertiser ID value',
      reason: 'missing-advertiser-id'
    })
  })

  it('requires an audience type for both operations', () => {
    expect(validateAudienceInputs(createInputs({ audienceType: '  ' }))).toEqual({
      error: 'Missing audience type value',
      reason: 'missing-audience-type'
    })
    expect(validateAudienceInputs(existingInputs({ audienceType: undefined }))).toEqual({
      error: 'Missing audience type value',
      reason: 'missing-audience-type'
    })
  })

  it('requires an audience ID when connecting to an existing audience', () => {
    expect(validateAudienceInputs(existingInputs({ existingAudienceId: '  ' }))).toEqual({
      error: 'Missing Existing Audience ID value',
      reason: 'missing-audience-id'
    })
  })

  it('returns trimmed values when connecting to an existing audience', () => {
    expect(
      validateAudienceInputs(
        existingInputs({
          advertiserId: ` ${ADVERTISER_ID} `,
          existingAudienceId: ` ${AUDIENCE_ID} `,
          audienceType: ` ${DEVICE_ID} `
        })
      )
    ).toEqual({
      operation: 'existing',
      advertiserId: ADVERTISER_ID,
      existingAudienceId: AUDIENCE_ID,
      audienceType: DEVICE_ID
    })
  })

  it.each([undefined, '', '   '])('requires an audience name when creating (%p)', (audienceName) => {
    expect(validateAudienceInputs(createInputs({ audienceName }))).toEqual({
      error: 'Missing audience name value',
      reason: 'missing-audience-name'
    })
  })

  it.each([undefined, '', '   '])('requires a membership duration when creating (%p)', (membershipDurationDays) => {
    expect(validateAudienceInputs(createInputs({ membershipDurationDays }))).toEqual({
      error: 'Missing membership duration days value',
      reason: 'missing-membership-duration'
    })
  })

  it.each([0, -1, 541, 90.5, 'abc'])('rejects a membership duration of %p', (membershipDurationDays) => {
    expect(validateAudienceInputs(createInputs({ membershipDurationDays }))).toEqual({
      error: 'Membership duration days must be a whole number greater than 0 and less than or equal to 540',
      reason: 'invalid-membership-duration'
    })
  })

  it.each([' 30 ', 30])('returns the membership duration %p as an int64 string', (membershipDurationDays) => {
    expect(validateAudienceInputs(createInputs({ membershipDurationDays }))).toMatchObject({
      membershipDurationDays: '30'
    })
  })

  it('trims the create inputs, turning blank values into undefined', () => {
    expect(
      validateAudienceInputs(
        createInputs({
          advertiserId: ` ${ADVERTISER_ID} `,
          audienceName: `  ${AUDIENCE_NAME}  `,
          audienceType: ` ${DEVICE_ID} `,
          description: '   ',
          appId: '  com.example.app  '
        })
      )
    ).toEqual({
      operation: 'create',
      advertiserId: ADVERTISER_ID,
      audienceName: AUDIENCE_NAME,
      audienceType: DEVICE_ID,
      membershipDurationDays: '30',
      description: undefined,
      appId: 'com.example.app'
    })
  })

  it('validates create_or_connect the same way as create, keeping the operation', () => {
    expect(validateAudienceInputs(createInputs({ operation: 'create_or_connect' }))).toMatchObject({
      operation: 'create_or_connect',
      audienceName: AUDIENCE_NAME,
      membershipDurationDays: '30'
    })
    expect(validateAudienceInputs(createInputs({ operation: 'create_or_connect', audienceName: '' }))).toEqual({
      error: 'Missing audience name value',
      reason: 'missing-audience-name'
    })
  })

  it('keeps the App ID for device ID audiences and drops it for contact info audiences', () => {
    expect(validateAudienceInputs(createInputs({ audienceType: DEVICE_ID, appId: 'com.example.app' }))).toMatchObject({
      appId: 'com.example.app'
    })
    expect(
      validateAudienceInputs(createInputs({ audienceType: CONTACT_INFO, appId: 'com.example.app' }))
    ).not.toHaveProperty('appId')
  })
})

describe('getAudience', () => {
  const params = { advertiserId: ADVERTISER_ID, audienceId: AUDIENCE_ID }

  it('returns the audience', async () => {
    nock(DV360_HOST)
      .get(GET_PATH)
      .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID, audienceType: CONTACT_INFO })

    await expect(getAudience(request, params)).resolves.toEqual({
      firstPartyAndPartnerAudienceId: AUDIENCE_ID,
      audienceType: CONTACT_INFO
    })
  })

  it('sends the access token when one is given', async () => {
    nock(DV360_HOST, { reqheaders: { authorization: 'Bearer temp-token' } })
      .get(GET_PATH)
      .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })

    await expect(getAudience(request, { ...params, token: 'temp-token' })).resolves.toMatchObject({
      firstPartyAndPartnerAudienceId: AUDIENCE_ID
    })
  })

  it('sends no authorization header when no token is given', async () => {
    nock(DV360_HOST, { badheaders: ['authorization'] })
      .get(GET_PATH)
      .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })

    await expect(getAudience(request, params)).resolves.toMatchObject({
      firstPartyAndPartnerAudienceId: AUDIENCE_ID
    })
  })
})

describe('getAudienceByName', () => {
  const params = (audienceName = AUDIENCE_NAME) => ({ advertiserId: ADVERTISER_ID, audienceName })

  it('escapes quotes and backslashes in the name filter', async () => {
    const name = 'My "VIP" \\ list'
    nock(DV360_HOST)
      .get(LIST_PATH)
      .query({ advertiserId: ADVERTISER_ID, filter: 'displayName:"My \\"VIP\\" \\\\ list"' })
      .reply(200, { firstPartyAndPartnerAudiences: [firstParty({ displayName: name })] })

    await expect(getAudienceByName(request, params(name))).resolves.toMatchObject({ displayName: name })
  })

  it('only returns an audience whose name matches exactly', async () => {
    nock(DV360_HOST)
      .get(LIST_PATH)
      .query(listQuery())
      .reply(200, {
        firstPartyAndPartnerAudiences: [
          firstParty({ firstPartyAndPartnerAudienceId: 'other-id', displayName: `${AUDIENCE_NAME} - copy` }),
          firstParty()
        ]
      })

    await expect(getAudienceByName(request, params())).resolves.toMatchObject({
      firstPartyAndPartnerAudienceId: 'existing-id'
    })
  })

  it('ignores partner audiences', async () => {
    nock(DV360_HOST)
      .get(LIST_PATH)
      .query(listQuery())
      .reply(200, {
        firstPartyAndPartnerAudiences: [
          firstParty({
            firstPartyAndPartnerAudienceId: 'partner-id',
            firstPartyAndPartnerAudienceType: 'TYPE_PARTNER'
          }),
          firstParty()
        ]
      })

    await expect(getAudienceByName(request, params())).resolves.toMatchObject({
      firstPartyAndPartnerAudienceId: 'existing-id'
    })
  })

  it('pages through the audience list', async () => {
    nock(DV360_HOST)
      .get(LIST_PATH)
      .query(listQuery())
      .reply(200, {
        firstPartyAndPartnerAudiences: [
          firstParty({ firstPartyAndPartnerAudienceId: 'other-id', displayName: 'Other' })
        ],
        nextPageToken: 'page-2'
      })
    nock(DV360_HOST)
      .get(LIST_PATH)
      .query(listQuery(AUDIENCE_NAME, { pageToken: 'page-2' }))
      .reply(200, { firstPartyAndPartnerAudiences: [firstParty()] })

    await expect(getAudienceByName(request, params())).resolves.toMatchObject({
      firstPartyAndPartnerAudienceId: 'existing-id'
    })
  })

  it('returns undefined when no audience matches', async () => {
    nock(DV360_HOST).get(LIST_PATH).query(listQuery()).reply(200, {})

    await expect(getAudienceByName(request, params())).resolves.toBeUndefined()
    expect(nock.isDone()).toBe(true)
  })

  it('errors when more than one first party audience has the name', async () => {
    nock(DV360_HOST)
      .get(LIST_PATH)
      .query(listQuery())
      .reply(200, {
        firstPartyAndPartnerAudiences: [
          firstParty({ firstPartyAndPartnerAudienceId: 'id-1' }),
          firstParty({ firstPartyAndPartnerAudienceId: 'id-2' })
        ]
      })

    await expect(getAudienceByName(request, params())).rejects.toMatchObject({
      message: `More than one first party audience named "${AUDIENCE_NAME}" exists in Display & Video 360 (IDs id-1, id-2). Set "Create or Connect Audience" to "Connect to existing audience" and enter the correct one as the Existing Audience ID, or choose a different Audience Name.`,
      code: 'CREATE_AUDIENCE_FAILED',
      status: 400
    })
  })

  it('caps the number of IDs listed in the error', async () => {
    nock(DV360_HOST)
      .get(LIST_PATH)
      .query(listQuery())
      .reply(200, {
        firstPartyAndPartnerAudiences: [1, 2, 3, 4, 5, 6, 7].map((n) =>
          firstParty({ firstPartyAndPartnerAudienceId: `id-${n}` })
        )
      })

    await expect(getAudienceByName(request, params())).rejects.toThrowError(
      '(IDs id-1, id-2, id-3, id-4, id-5 and 2 more)'
    )
  })

  it('errors when pages remain after the page limit, even with a match', async () => {
    for (let page = 0; page < 10; page++) {
      nock(DV360_HOST)
        .get(LIST_PATH)
        .query(listQuery(AUDIENCE_NAME, page === 0 ? {} : { pageToken: `page-${page}` }))
        .reply(200, {
          firstPartyAndPartnerAudiences: page === 0 ? [firstParty()] : [],
          nextPageToken: `page-${page + 1}`
        })
    }

    await expect(getAudienceByName(request, params())).rejects.toMatchObject({
      message: `An audience named "${AUDIENCE_NAME}" already exists in Display & Video 360, but Segment could not confirm it is the only one after searching 10 pages of results. Find the audience's ID in Display & Video 360, set "Create or Connect Audience" to "Connect to existing audience" and enter it as the Existing Audience ID, or choose a different Audience Name.`,
      code: 'GET_AUDIENCE_FAILED',
      status: 400
    })
  })

  it('passes through the error when the audience list cannot be read', async () => {
    nock(DV360_HOST)
      .get(LIST_PATH)
      .query(listQuery())
      .reply(403, { error: { code: 403, message: 'The caller does not have permission', status: 'PERMISSION_DENIED' } })

    await expect(getAudienceByName(request, params())).rejects.toMatchObject({
      message: `An audience named "${AUDIENCE_NAME}" already exists in Display & Video 360, but Segment could not look it up: The caller does not have permission`,
      code: 'GET_AUDIENCE_FAILED',
      status: 403
    })
  })
})

describe('createOrConnectAudience', () => {
  describe('creating an audience', () => {
    it('creates the audience', async () => {
      nock(DV360_HOST)
        .post(CREATE_PATH, {
          displayName: AUDIENCE_NAME,
          audienceType: CONTACT_INFO,
          membershipDurationDays: '30',
          description: 'A description',
          audienceSource: 'AUDIENCE_SOURCE_UNSPECIFIED',
          firstPartyAndPartnerAudienceType: 'TYPE_FIRST_PARTY'
        })
        .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })

      await expect(
        createOrConnectAudience(request, createInputs({ description: 'A description' }), options)
      ).resolves.toEqual({
        audienceId: AUDIENCE_ID,
        advertiserId: ADVERTISER_ID,
        audienceType: CONTACT_INFO,
        appId: undefined,
        outcome: 'created'
      })
    })

    it('creates a device ID audience with its trimmed App ID', async () => {
      nock(DV360_HOST)
        .post(CREATE_PATH, {
          displayName: AUDIENCE_NAME,
          audienceType: DEVICE_ID,
          membershipDurationDays: '30',
          audienceSource: 'AUDIENCE_SOURCE_UNSPECIFIED',
          firstPartyAndPartnerAudienceType: 'TYPE_FIRST_PARTY',
          appId: 'com.example.app'
        })
        .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })

      await expect(
        createOrConnectAudience(request, createInputs({ audienceType: DEVICE_ID, appId: ' com.example.app ' }), options)
      ).resolves.toEqual({
        audienceId: AUDIENCE_ID,
        advertiserId: ADVERTISER_ID,
        audienceType: DEVICE_ID,
        appId: 'com.example.app',
        outcome: 'created'
      })
    })

    it('does not connect to an audience with the same name, and names its ID in the error', async () => {
      nock(DV360_HOST).post(CREATE_PATH).reply(400, nameExists)
      nock(DV360_HOST)
        .get(LIST_PATH)
        .query(listQuery())
        .reply(200, { firstPartyAndPartnerAudiences: [firstParty()] })

      await expect(createOrConnectAudience(request, createInputs(), options)).rejects.toMatchObject({
        message: `An audience named "${AUDIENCE_NAME}" already exists in Display & Video 360 (ID existing-id). To use it, set "Create or Connect Audience" to "Connect to existing audience" and enter existing-id as the Existing Audience ID, or choose "Create new audience, or connect to an existing one with the same name". Otherwise, choose a different Audience Name.`,
        code: 'CREATE_AUDIENCE_FAILED',
        status: 400
      })
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('reconnecting when the name already exists', () => {
    const reconnectInputs = (overrides: Partial<AudienceInputs> = {}) =>
      createInputs({ operation: 'create_or_connect', ...overrides })
    const mockNameExists = (existing: Record<string, unknown>[], status = 400) => {
      nock(DV360_HOST).post(CREATE_PATH).reply(status, nameExists)
      nock(DV360_HOST).get(LIST_PATH).query(listQuery()).reply(200, { firstPartyAndPartnerAudiences: existing })
    }

    it('connects to the existing audience', async () => {
      mockNameExists([firstParty()])

      await expect(createOrConnectAudience(request, reconnectInputs(), options)).resolves.toEqual({
        audienceId: 'existing-id',
        advertiserId: ADVERTISER_ID,
        audienceType: CONTACT_INFO,
        appId: undefined,
        outcome: 'reconnected'
      })
    })

    it('errors when the existing audience has a different type', async () => {
      mockNameExists([firstParty({ audienceType: DEVICE_ID })])

      await expect(createOrConnectAudience(request, reconnectInputs(), options)).rejects.toThrowError(
        `An audience named "${AUDIENCE_NAME}" already exists in Display & Video 360 (ID existing-id) but its settings differ: Audience Type is ${DEVICE_ID} (requested ${CONTACT_INFO}).`
      )
    })

    it('errors when the existing audience has a different membership duration', async () => {
      mockNameExists([firstParty({ membershipDurationDays: '540' })])

      await expect(createOrConnectAudience(request, reconnectInputs(), options)).rejects.toThrowError(
        'but its settings differ: Membership Duration Days is 540 (requested 30).'
      )
    })

    it('reports a membership duration which is not set on the existing audience', async () => {
      mockNameExists([firstParty({ membershipDurationDays: undefined })])

      await expect(createOrConnectAudience(request, reconnectInputs(), options)).rejects.toThrowError(
        'but its settings differ: Membership Duration Days is not set (requested 30).'
      )
    })

    it('connects to a device ID audience whose App ID matches, ignoring whitespace', async () => {
      mockNameExists([firstParty({ audienceType: DEVICE_ID, appId: ' com.example.app ' })])

      await expect(
        createOrConnectAudience(
          request,
          reconnectInputs({ audienceType: DEVICE_ID, appId: 'com.example.app' }),
          options
        )
      ).resolves.toEqual({
        audienceId: 'existing-id',
        advertiserId: ADVERTISER_ID,
        audienceType: DEVICE_ID,
        appId: 'com.example.app',
        outcome: 'reconnected'
      })
    })

    it('connects to a device ID audience when neither side has an App ID', async () => {
      mockNameExists([firstParty({ audienceType: DEVICE_ID })])

      await expect(
        createOrConnectAudience(request, reconnectInputs({ audienceType: DEVICE_ID }), options)
      ).resolves.toMatchObject({ audienceId: 'existing-id', appId: undefined, outcome: 'reconnected' })
    })

    it('errors when a device ID audience has a different App ID', async () => {
      mockNameExists([firstParty({ audienceType: DEVICE_ID, appId: 'com.other.app' })])

      await expect(
        createOrConnectAudience(
          request,
          reconnectInputs({ audienceType: DEVICE_ID, appId: 'com.example.app' }),
          options
        )
      ).rejects.toThrowError('but its settings differ: App ID is com.other.app (requested com.example.app).')
    })

    it('ignores the App ID for contact info audiences', async () => {
      mockNameExists([firstParty({ appId: 'com.other.app' })])

      await expect(
        createOrConnectAudience(request, reconnectInputs({ appId: 'com.example.app' }), options)
      ).resolves.toMatchObject({ audienceId: 'existing-id', outcome: 'reconnected' })
    })

    it('lists every setting which differs', async () => {
      mockNameExists([firstParty({ audienceType: DEVICE_ID, membershipDurationDays: '540' })])

      await expect(createOrConnectAudience(request, reconnectInputs(), options)).rejects.toThrowError(
        `but its settings differ: Audience Type is ${DEVICE_ID} (requested ${CONTACT_INFO}); Membership Duration Days is 540 (requested 30).`
      )
    })

    it('reports the original error when the existing audience cannot be found', async () => {
      mockNameExists([])

      await expect(createOrConnectAudience(request, reconnectInputs(), options)).rejects.toMatchObject({
        message: `Failed to create audience in Display & Video 360: ${nameExists.error.message}`,
        code: 'CREATE_AUDIENCE_FAILED',
        status: 400
      })
      expect(nock.isDone()).toBe(true)
    })

    it('reconnects whatever status the already exists error has', async () => {
      mockNameExists([firstParty()], 409)

      await expect(createOrConnectAudience(request, reconnectInputs(), options)).resolves.toMatchObject({
        audienceId: 'existing-id',
        outcome: 'reconnected'
      })
    })
  })

  describe('connecting to an existing audience', () => {
    it('connects and returns the App ID held by Display & Video 360', async () => {
      nock(DV360_HOST).get(GET_PATH).reply(200, {
        firstPartyAndPartnerAudienceId: AUDIENCE_ID,
        audienceType: DEVICE_ID,
        appId: 'com.example.app'
      })

      await expect(
        createOrConnectAudience(request, existingInputs({ audienceType: DEVICE_ID }), options)
      ).resolves.toEqual({
        audienceId: AUDIENCE_ID,
        advertiserId: ADVERTISER_ID,
        audienceType: DEVICE_ID,
        appId: 'com.example.app',
        outcome: 'existing'
      })
    })

    it('errors when the existing audience has a different type', async () => {
      nock(DV360_HOST)
        .get(GET_PATH)
        .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID, audienceType: DEVICE_ID })

      await expect(createOrConnectAudience(request, existingInputs(), options)).rejects.toMatchObject({
        message: expect.stringContaining(
          `Could not connect to the existing Display & Video 360 audience with ID "${AUDIENCE_ID}": its type is ${DEVICE_ID}, but the Audience Type setting is ${CONTACT_INFO}.`
        ),
        code: 'CREATE_AUDIENCE_FAILED',
        status: 400
      })
    })

    it('passes through the error when the existing audience cannot be read', async () => {
      nock(DV360_HOST)
        .get(GET_PATH)
        .reply(404, { error: { code: 404, message: 'Requested entity was not found.', status: 'NOT_FOUND' } })

      await expect(createOrConnectAudience(request, existingInputs(), options)).rejects.toMatchObject({
        message: `Failed to retrieve audience ${AUDIENCE_ID} from Display & Video 360: Requested entity was not found.`,
        status: 404
      })
    })
  })

  describe('validation and stats', () => {
    it('throws a MISSING_REQUIRED_FIELD error without calling Display & Video 360 when inputs are invalid', async () => {
      const anyRequest = nock(DV360_HOST)
        .post(() => true)
        .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })

      await expect(
        createOrConnectAudience(request, createInputs({ advertiserId: undefined }), options)
      ).rejects.toMatchObject({
        message: 'Missing advertiser ID value',
        code: 'MISSING_REQUIRED_FIELD',
        status: 400
      })
      expect(anyRequest.isDone()).toBe(false)
    })

    it.each([
      ['created', () => nock(DV360_HOST).post(CREATE_PATH).reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })],
      [
        'reconnected',
        () => {
          nock(DV360_HOST).post(CREATE_PATH).reply(400, nameExists)
          nock(DV360_HOST)
            .get(LIST_PATH)
            .query(listQuery())
            .reply(200, { firstPartyAndPartnerAudiences: [firstParty()] })
        }
      ]
    ])('records call and success stats for an audience which is %s', async (outcome, mock) => {
      mock()
      const { incr, statsContext } = statsContextWith()

      await createOrConnectAudience(request, createInputs({ operation: 'create_or_connect' }), {
        statsName: 'testStat',
        statsContext
      })

      expect(incr).toHaveBeenCalledWith('testStat.call', 1, ['env:test', 'slug:actions-first-party-dv360'])
      expect(incr).toHaveBeenCalledWith('testStat.success', 1, [
        'env:test',
        'slug:actions-first-party-dv360',
        `audience:${outcome}`
      ])
    })

    it('records success stats for an existing audience', async () => {
      nock(DV360_HOST)
        .get(GET_PATH)
        .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID, audienceType: CONTACT_INFO })
      const { incr, statsContext } = statsContextWith()

      await createOrConnectAudience(request, existingInputs(), { statsName: 'testStat', statsContext })

      expect(incr).toHaveBeenCalledWith('testStat.success', 1, [
        'env:test',
        'slug:actions-first-party-dv360',
        'audience:existing'
      ])
    })

    it('records a missing-settings error stat when inputs are invalid', async () => {
      const { incr, statsContext } = statsContextWith()

      await expect(
        createOrConnectAudience(request, createInputs({ audienceName: undefined }), {
          statsName: 'testStat',
          statsContext
        })
      ).rejects.toThrowError('Missing audience name value')

      expect(incr).toHaveBeenCalledWith('testStat.error', 1, [
        'env:test',
        'slug:actions-first-party-dv360',
        'error:missing-settings',
        'reason:missing-audience-name'
      ])
    })

    it('records the error code as a stat when Display & Video 360 rejects the request', async () => {
      nock(DV360_HOST)
        .post(CREATE_PATH)
        .reply(403, { error: { message: 'The caller does not have permission' } })
      const { incr, statsContext } = statsContextWith()

      await expect(
        createOrConnectAudience(request, createInputs(), { statsName: 'testStat', statsContext })
      ).rejects.toThrowError('The caller does not have permission')

      expect(incr).toHaveBeenCalledWith('testStat.error', 1, [
        'env:test',
        'slug:actions-first-party-dv360',
        'error:CREATE_AUDIENCE_FAILED',
        'reason:dv360-error',
        'status:403'
      ])
    })

    const mockCreateFails = (status: number, body: Record<string, unknown>) =>
      nock(DV360_HOST).post(CREATE_PATH).reply(status, body)
    const mockList = (audiences: Record<string, unknown>[]) =>
      nock(DV360_HOST).get(LIST_PATH).query(listQuery()).reply(200, { firstPartyAndPartnerAudiences: audiences })

    it.each([
      ['network-error', undefined, createInputs(), () => nock(DV360_HOST).post(CREATE_PATH).replyWithError('boom')],
      ['no-audience-id-in-response', 200, createInputs(), () => mockCreateFails(200, {})],
      ['name-exists', undefined, createInputs(), () => (mockCreateFails(400, nameExists), mockList([firstParty()]))],
      ['name-exists-not-found', 400, createInputs(), () => (mockCreateFails(400, nameExists), mockList([]))],
      [
        'name-exists-settings-mismatch',
        undefined,
        createInputs({ operation: 'create_or_connect' }),
        () => (mockCreateFails(400, nameExists), mockList([firstParty({ membershipDurationDays: '540' })]))
      ],
      [
        'name-exists-multiple-matches',
        undefined,
        createInputs(),
        () => (
          mockCreateFails(400, nameExists),
          mockList([
            firstParty({ firstPartyAndPartnerAudienceId: 'id-1' }),
            firstParty({ firstPartyAndPartnerAudienceId: 'id-2' })
          ])
        )
      ],
      [
        'name-exists-lookup-failed',
        403,
        createInputs(),
        () => (
          mockCreateFails(400, nameExists),
          nock(DV360_HOST)
            .get(LIST_PATH)
            .query(listQuery())
            .reply(403, { error: { message: 'Denied' } })
        )
      ],
      [
        'name-exists-page-limit',
        undefined,
        createInputs(),
        () => {
          mockCreateFails(400, nameExists)
          for (let page = 0; page < 10; page++) {
            nock(DV360_HOST)
              .get(LIST_PATH)
              .query(listQuery(AUDIENCE_NAME, page === 0 ? {} : { pageToken: `page-${page}` }))
              .reply(200, { firstPartyAndPartnerAudiences: [], nextPageToken: `page-${page + 1}` })
          }
        }
      ],
      [
        'existing-type-mismatch',
        undefined,
        existingInputs(),
        () =>
          nock(DV360_HOST)
            .get(GET_PATH)
            .reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID, audienceType: DEVICE_ID })
      ],
      [
        'dv360-error',
        404,
        existingInputs(),
        () =>
          nock(DV360_HOST)
            .get(GET_PATH)
            .reply(404, { error: { message: 'Not found' } })
      ]
    ])(
      'records reason:%s on the error stat',
      async (reason: string, dv360Status: number | undefined, inputs: AudienceInputs, mock: () => unknown) => {
        mock()
        const { incr, statsContext } = statsContextWith()

        await expect(
          createOrConnectAudience(request, inputs, { statsName: 'testStat', statsContext })
        ).rejects.toThrow()

        const errorTags = incr.mock.calls.find(([name]) => name === 'testStat.error')?.[2] as string[]
        expect(errorTags).toContain(`reason:${reason}`)
        expect(errorTags.filter((tag) => tag.startsWith('status:'))).toEqual(
          dv360Status ? [`status:${dv360Status}`] : []
        )
      }
    )

    it('does not modify the tags of the stats context it is given', async () => {
      nock(DV360_HOST).post(CREATE_PATH).reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })
      const { statsContext } = statsContextWith()

      await createOrConnectAudience(request, createInputs(), { statsName: 'testStat', statsContext })

      expect(statsContext.tags).toEqual(['env:test'])
    })
  })
})

// getAudience and the create path read Display & Video 360's responses the same way, so they share these cases.
describe.each([
  {
    name: 'getAudience',
    mock: () => nock(DV360_HOST).get(GET_PATH),
    call: () => getAudience(request, { advertiserId: ADVERTISER_ID, audienceId: AUDIENCE_ID }),
    prefix: `Failed to retrieve audience ${AUDIENCE_ID} from Display & Video 360`,
    code: 'GET_AUDIENCE_FAILED'
  },
  {
    name: 'createOrConnectAudience when creating',
    mock: () => nock(DV360_HOST).post(CREATE_PATH),
    call: () => createOrConnectAudience(request, createInputs(), options),
    prefix: 'Failed to create audience in Display & Video 360',
    code: 'CREATE_AUDIENCE_FAILED'
  }
])('$name error handling', ({ mock, call, prefix, code }) => {
  it.each([
    [
      'passes through the error message and status',
      403,
      { error: { code: 403, message: 'The caller does not have permission', status: 'PERMISSION_DENIED' } },
      'The caller does not have permission',
      403
    ],
    ['reports the HTTP status when there is no error message', 502, 'Bad Gateway', 'HTTP 502', 502],
    ['fails when a 200 response has no audience ID', 200, {}, 'the response did not include an audience ID', 400],
    [
      'reports the message in a 200 response which has no audience ID',
      200,
      { error: { message: 'Advertiser not found' } },
      'Advertiser not found',
      400
    ]
  ])(
    '%s',
    async (
      _title: string,
      replyStatus: number,
      replyBody: string | Record<string, unknown>,
      detail: string,
      status: number
    ) => {
      mock().reply(replyStatus, replyBody)

      await expect(call()).rejects.toMatchObject({ message: `${prefix}: ${detail}`, code, status })
    }
  )

  it('reports a network failure as an IntegrationError', async () => {
    mock().replyWithError('socket hang up')

    await expect(call()).rejects.toMatchObject({
      message: expect.stringContaining('Could not reach Display & Video 360:'),
      code,
      status: 500
    })
  })
})
