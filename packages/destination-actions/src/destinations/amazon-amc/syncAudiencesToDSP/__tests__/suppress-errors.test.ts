import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { SegmentEvent } from '@segment/actions-core/*'
import { FLAG_CONSENT_REQUIRED, FLAG_CONSENT_SUPPRESS_ERRORS } from '../../utils'

const testDestination = createTestIntegration(Destination)

const event = createTestEvent({
  context: {
    personas: {
      audience_settings: {
        advertiserId: '585806696618602999',
        countryCode: 'US',
        description: 'Test Event',
        externalAudienceId: '65241452'
      },
      computation_class: 'audience',
      computation_id: 'aud_2g5VilffxpBYqelWk4K0yBzAuFl',
      computation_key: 'amazon_ads_audience_6_may_24',
      external_audience_id: '379909525712777677',
      namespace: 'spa_rHVbZsJXToWAwcmbgpfo36',
      space_id: 'spa_rHVbZsJXToWAwcmbgpfo36'
    },
    traits: {
      email: 'test@twilio.com'
    }
  },
  event: 'Audience Entered',
  messageId: 'personas_2g5WGNhZtTET4DhSeILpE6muHnH',
  properties: {
    amazon_ads_audience_6_may_24: true,
    audience_key: 'amazon_ads_audience_6_may_24',
    externalId: '379909525712777677'
  },
  receivedAt: '2024-05-06T09:30:38.650Z',
  timestamp: '2024-05-06T09:30:22.829Z',
  type: 'track',
  userId: 'test-kochar-01',
  writeKey: 'REDACTED'
})

const settings = {
  region: 'https://advertising-api.amazon.com'
}

const mapping = {
  email: { '@path': '$.properties.email' },
  event_name: { '@path': '$.event' },
  externalUserId: { '@path': '$.userId' },
  audienceId: { '@path': '$.context.personas.external_audience_id' },
  enable_batching: true
}

const featuresWithoutErrorFlag = { [FLAG_CONSENT_REQUIRED]: true }
const featuresWithErrorFlag = { [FLAG_CONSENT_REQUIRED]: true, [FLAG_CONSENT_SUPPRESS_ERRORS]: true }

describe('AmazonAds.syncAudiencesToDSP (consent suppress errors flag)', () => {
  beforeEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should not throw for EEA country code without consent when suppress errors flag is off (single event)', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const deEvent = {
      ...event,
      context: {
        ...event.context,
        personas: {
          ...event.context!.personas,
          audience_settings: {
            ...event.context!.personas!.audience_settings,
            countryCode: 'DE'
          }
        }
      }
    }

    const response = await testDestination.testAction('syncAudiencesToDSP', {
      event: deEvent,
      settings,
      useDefaultMappings: true,
      features: featuresWithoutErrorFlag
    })

    expect(response[0].status).toBe(202)
  })

  it('should throw for EEA country code without consent when suppress errors flag is on (single event)', async () => {
    const deEvent = {
      ...event,
      context: {
        ...event.context,
        personas: {
          ...event.context!.personas,
          audience_settings: {
            ...event.context!.personas!.audience_settings,
            countryCode: 'DE'
          }
        }
      }
    }

    await expect(
      testDestination.testAction('syncAudiencesToDSP', {
        event: deEvent,
        settings,
        useDefaultMappings: true,
        features: featuresWithErrorFlag
      })
    ).rejects.toThrowError(
      'Consent required when sending data with UK and EEA country code DE. Please provide valid consent for amznAdStorage and amznUserData or TCF or GPP.'
    )
  })

  it('should not produce per-record consent errors when suppress errors flag is off (batch)', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const deEvents: SegmentEvent[] = [
      {
        ...event,
        userId: 'test_user_01',
        context: {
          ...event.context,
          personas: {
            ...event.context!.personas,
            audience_settings: {
              ...event.context!.personas!.audience_settings,
              countryCode: 'DE'
            }
          }
        },
        event: 'Audience Entered'
      }
    ]

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events: deEvents,
      settings,
      mapping,
      features: featuresWithoutErrorFlag
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(202)
    expect(response[0]).not.toHaveProperty('errortype')
  })

  it('should produce per-record consent errors when suppress errors flag is on (batch)', async () => {
    const deEvents: SegmentEvent[] = [
      {
        ...event,
        userId: 'test_user_01',
        context: {
          ...event.context,
          personas: {
            ...event.context!.personas,
            audience_settings: {
              ...event.context!.personas!.audience_settings,
              countryCode: 'DE'
            }
          }
        },
        event: 'Audience Entered'
      }
    ]

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events: deEvents,
      settings,
      mapping,
      features: featuresWithErrorFlag
    })

    expect(response.length).toBe(1)
    expect(response[0]).toEqual(
      expect.objectContaining({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage:
          'Consent required when sending data with UK and EEA country code DE. Please provide valid consent for amznAdStorage and amznUserData or TCF or GPP.'
      })
    )
  })

  it('should throw for invalid country code when suppress errors flag is on (single event)', async () => {
    const invalidCountryEvent = {
      ...event,
      context: {
        ...event.context,
        personas: {
          ...event.context!.personas,
          audience_settings: {
            ...event.context!.personas!.audience_settings,
            countryCode: 'XX'
          }
        }
      }
    }

    await expect(
      testDestination.testAction('syncAudiencesToDSP', {
        event: invalidCountryEvent,
        settings,
        useDefaultMappings: true,
        features: featuresWithErrorFlag
      })
    ).rejects.toThrowError(
      'Invalid country code: XX. Country code must be a valid ISO 3166-1 alpha-2 code.'
    )
  })

  it('should not throw for invalid country code when suppress errors flag is off (single event)', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const invalidCountryEvent = {
      ...event,
      context: {
        ...event.context,
        personas: {
          ...event.context!.personas,
          audience_settings: {
            ...event.context!.personas!.audience_settings,
            countryCode: 'XX'
          }
        }
      }
    }

    const response = await testDestination.testAction('syncAudiencesToDSP', {
      event: invalidCountryEvent,
      settings,
      useDefaultMappings: true,
      features: featuresWithoutErrorFlag
    })

    expect(response[0].status).toBe(202)
  })
})
