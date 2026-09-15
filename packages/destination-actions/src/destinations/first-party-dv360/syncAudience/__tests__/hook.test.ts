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
