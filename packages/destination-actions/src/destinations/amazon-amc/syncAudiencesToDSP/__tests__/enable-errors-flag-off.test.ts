import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { SegmentEvent } from '@segment/actions-core/*'
import { FLAG_CONSENT_REQUIRED } from '../../utils'

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

const mapping = {
  email: { '@path': '$.properties.email' },
  event_name: { '@path': '$.event' },
  externalUserId: { '@path': '$.userId' },
  audienceId: { '@path': '$.context.personas.external_audience_id' },
  enable_batching: true
}

const settings = {
  region: 'https://advertising-api.amazon.com'
}

// FLAG_CONSENT_REQUIRED is ON, but FLAG_CONSENT_ENABLE_ERRORS is OFF.
// This is the safe rollout state: consent objects are built and sent to Amazon,
// but missing/invalid consent does not block events. Once Amazon starts
// validating consent in June, FLAG_CONSENT_ENABLE_ERRORS will be turned on
// to surface errors back to users.
// Delete this file when FLAG_CONSENT_ENABLE_ERRORS is removed.
const features = { [FLAG_CONSENT_REQUIRED]: true }

describe('AmazonAds.syncAudiencesToDSP (enable errors flag off)', () => {
  beforeEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should not throw when an EEA country code is passed without consent (single event)', async () => {
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
      features
    })

    expect(response[0].status).toBe(202)
  })

  it('should not return consent validation errors in batch when EEA country code is provided without consent', async () => {
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
      },
      {
        ...event,
        userId: 'test_user_02',
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
        event: 'Audience Exited'
      }
    ]

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events: deEvents,
      settings,
      mapping,
      features
    })

    expect(response.length).toBe(2)
    expect(response[0].status).toBe(202)
    expect(response[0]).not.toHaveProperty('errortype')
    expect(response[1].status).toBe(202)
    expect(response[1]).not.toHaveProperty('errortype')
  })

  it('should send both events successfully in batch when one has consent and one does not', async () => {
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
        properties: {
          ...event.properties,
          amznAdStorage: 'GRANTED',
          amznUserData: 'GRANTED'
        },
        event: 'Audience Entered'
      },
      {
        ...event,
        userId: 'test_user_02',
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
        event: 'Audience Exited'
      }
    ]

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events: deEvents,
      settings,
      mapping: {
        ...mapping,
        consent: {
          amznAdStorage: { '@path': '$.properties.amznAdStorage' },
          amznUserData: { '@path': '$.properties.amznUserData' }
        }
      },
      features
    })

    expect(response.length).toBe(2)
    expect(response[0].status).toBe(202)
    expect(response[1].status).toBe(202)
  })

  it('should still include consent data in the record when consent is provided', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events: [
        {
          ...event,
          userId: 'test_kochar-02',
          context: {
            ...event.context,
            ip: '1.2.3.4',
            personas: {
              ...event.context!.personas,
              audience_settings: {
                ...event.context!.personas!.audience_settings,
                countryCode: 'DE'
              }
            }
          },
          properties: {
            ...event.properties,
            amznAdStorage: 'GRANTED',
            amznUserData: 'GRANTED'
          }
        },
        {
          ...event,
          userId: 'test_kochar-03',
          context: {
            ...event.context,
            ip: '5.6.7.8',
            personas: {
              ...event.context!.personas,
              audience_settings: {
                ...event.context!.personas!.audience_settings,
                countryCode: 'DE'
              }
            }
          },
          properties: {
            ...event.properties,
            amznAdStorage: 'GRANTED',
            amznUserData: 'GRANTED'
          },
          event: 'Audience Exited'
        }
      ],
      settings,
      mapping: {
        ...mapping,
        consent: {
          ipAddress: { '@path': '$.context.ip' },
          amznAdStorage: { '@path': '$.properties.amznAdStorage' },
          amznUserData: { '@path': '$.properties.amznUserData' }
        }
      },
      features
    })

    expect(response.length).toBe(2)
    expect(response[0].status).toBe(202)
    expect(response[0]).toEqual({
      status: 202,
      sent: expect.objectContaining({
        userConsent: {
          geo: { ipAddress: '1.2.3.4', countryCode: 'DE' },
          consent: { amzn: { amznAdStorage: 'GRANTED', amznUserData: 'GRANTED' } }
        }
      }),
      body: { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' }
    })
    expect(response[1].status).toBe(202)
    expect(response[1]).toEqual({
      status: 202,
      sent: expect.objectContaining({
        userConsent: {
          geo: { ipAddress: '5.6.7.8', countryCode: 'DE' },
          consent: { amzn: { amznAdStorage: 'GRANTED', amznUserData: 'GRANTED' } }
        }
      }),
      body: { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' }
    })
  })

  it('should not throw when an invalid country code is provided (single event)', async () => {
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
      features
    })

    expect(response[0].status).toBe(202)
  })

  it('should not return error in batch when an invalid country code is provided', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const invalidCountryEvents: SegmentEvent[] = [
      {
        ...event,
        userId: 'test_user_01',
        context: {
          ...event.context,
          personas: {
            ...event.context!.personas,
            audience_settings: {
              ...event.context!.personas!.audience_settings,
              countryCode: 'XX'
            }
          }
        },
        event: 'Audience Entered'
      },
      {
        ...event,
        userId: 'test_user_02',
        context: {
          ...event.context,
          personas: {
            ...event.context!.personas,
            audience_settings: {
              ...event.context!.personas!.audience_settings,
              countryCode: 'XX'
            }
          }
        },
        event: 'Audience Exited'
      }
    ]

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events: invalidCountryEvents,
      settings,
      mapping,
      features
    })

    expect(response.length).toBe(2)
    expect(response[0].status).toBe(202)
    expect(response[0]).not.toHaveProperty('errortype')
    expect(response[1].status).toBe(202)
    expect(response[1]).not.toHaveProperty('errortype')
  })
})
