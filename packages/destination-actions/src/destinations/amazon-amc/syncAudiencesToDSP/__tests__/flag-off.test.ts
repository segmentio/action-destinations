import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

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

// These tests cover behavior when the FLAG_CONSENT_REQUIRED feature flag is OFF (no `features` passed).
// Delete this file when the flag is removed from the production code.
describe('AmazonAds.syncAudiencesToDSP (flag off)', () => {
  beforeEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should not include userConsent in the record when flag is off', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events: [{ ...event, userId: 'test_kochar-02' }],
      settings,
      mapping
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(202)
    expect(response[0]).not.toHaveProperty('sent.userConsent')
  })

  it('should not throw a consent error for EEA country code when flag is off (single event)', async () => {
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
      useDefaultMappings: true
    })

    expect(response[response.length - 1].status).toBe(202)
  })

  it('should not produce a per-record consent error for EEA country code when flag is off (batch)', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const deEvent = {
      ...event,
      userId: 'test_kochar-02',
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

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events: [deEvent],
      settings,
      mapping
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(202)
    expect(response[0]).not.toHaveProperty('errortype')
  })
})
