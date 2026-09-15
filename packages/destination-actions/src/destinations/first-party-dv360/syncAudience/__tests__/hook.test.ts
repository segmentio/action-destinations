import nock from 'nock'
import createRequestClient from '../../../../../../core/src/create-request-client'
import { performHook } from '../hook-functions'
import type { RetlOnMappingSaveInputs } from '../generated-types'

const ADVERTISER_ID = '12345'
const AUDIENCE_ID = '98765'
const DV360_HOST = 'https://displayvideo.googleapis.com'
const CREATE_PATH = `/v4/firstPartyAndPartnerAudiences?advertiserId=${ADVERTISER_ID}`
const GET_PATH = `/v4/firstPartyAndPartnerAudiences/${AUDIENCE_ID}?advertiserId=${ADVERTISER_ID}`

const request = createRequestClient()

const inputs = (overrides: Partial<RetlOnMappingSaveInputs> = {}): RetlOnMappingSaveInputs =>
  ({
    operation: 'create',
    advertiserId: ADVERTISER_ID,
    audienceName: 'My Audience',
    audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
    membershipDurationDays: 90,
    ...overrides
  } as RetlOnMappingSaveInputs)

afterEach(() => {
  nock.cleanAll()
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

  const hookError = (message: string) => ({ error: { message, code: 'RETL_ON_MAPPING_SAVE_FAILED' } })

  // performHook is the only gate on these: the hook inputs are deliberately not marked
  // required, so that a missing value fails at mapping save with a message naming it
  // rather than blocking the mapping form.
  it.each([undefined, '', '   '])('requires an advertiser ID, whatever the operation (%p)', async (advertiserId) => {
    for (const operation of ['create', 'existing'] as const) {
      const result = await performHook(request, inputs({ advertiserId, operation }))

      expect(result).toEqual(hookError('Missing advertiser ID value'))
    }
  })

  it('requires an audience type when creating', async () => {
    const result = await performHook(request, inputs({ audienceType: undefined }))

    expect(result).toEqual(hookError('Missing audience type value'))
  })

  it('requires a membership duration when creating', async () => {
    const result = await performHook(request, inputs({ membershipDurationDays: undefined }))

    expect(result).toEqual(hookError('Missing membership duration days value'))
  })

  it.each([0, -1, 541, 90.5])('rejects a membership duration of %p', async (membershipDurationDays) => {
    const result = await performHook(request, inputs({ membershipDurationDays }))

    expect(result).toEqual(
      hookError('Membership duration days must be a whole number greater than 0 and less than or equal to 540')
    )
  })

  it('requires an audience ID when connecting to an existing audience', async () => {
    const result = await performHook(request, inputs({ operation: 'existing', existingAudienceId: undefined }))

    expect(result).toEqual(hookError('Missing audience ID value'))
  })

  it('rejects a missing operation', async () => {
    const result = await performHook(request, inputs({ operation: undefined }))

    expect(result).toEqual(hookError('Invalid operation value. Must be create or existing.'))
  })

  it('requires an app ID for a device ID audience', async () => {
    const result = await performHook(request, inputs({ audienceType: 'CUSTOMER_MATCH_DEVICE_ID' }))

    expect(result).toEqual({
      error: {
        message: 'App ID is required for CUSTOMER_MATCH_DEVICE_ID audiences',
        code: 'RETL_ON_MAPPING_SAVE_FAILED'
      }
    })
  })

  it('requires an audience name when creating', async () => {
    const result = await performHook(request, inputs({ audienceName: undefined }))

    expect(result).toEqual({
      error: { message: 'Missing audience name value', code: 'RETL_ON_MAPPING_SAVE_FAILED' }
    })
  })

  it('reads the audience type back when connecting to an existing audience', async () => {
    nock(DV360_HOST).get(GET_PATH).reply(200, {
      firstPartyAndPartnerAudienceId: AUDIENCE_ID,
      audienceType: 'CUSTOMER_MATCH_DEVICE_ID',
      appId: 'com.example.app'
    })

    const result = await performHook(
      request,
      inputs({ operation: 'existing', existingAudienceId: AUDIENCE_ID, audienceName: undefined })
    )

    expect(result).toEqual({
      successMessage: `Connected to audience with ID: ${AUDIENCE_ID}`,
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

  it('errors when the existing audience is not a Customer Match audience', async () => {
    nock(DV360_HOST).get(GET_PATH).reply(200, { firstPartyAndPartnerAudienceId: AUDIENCE_ID })

    const result = await performHook(
      request,
      inputs({ operation: 'existing', existingAudienceId: AUDIENCE_ID, audienceName: undefined })
    )

    expect(result).toEqual({
      error: {
        message: `Audience ${AUDIENCE_ID} is not a Customer Match Contact Info or Mobile Device ID audience`,
        code: 'RETL_ON_MAPPING_SAVE_FAILED'
      }
    })
  })

  it('rejects an invalid operation', async () => {
    const result = await performHook(request, inputs({ operation: 'nonsense' }))

    expect(result).toEqual({
      error: { message: 'Invalid operation value. Must be create or existing.', code: 'RETL_ON_MAPPING_SAVE_FAILED' }
    })
  })
})
