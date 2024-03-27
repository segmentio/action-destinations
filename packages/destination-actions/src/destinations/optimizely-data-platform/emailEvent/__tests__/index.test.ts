import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const emailEvent = createTestEvent({
  type: 'track',
  event: 'Email Opened',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'some_audience_name',
      computation_id: 'abc'
    },
    traits: {
      email: 'test.email@test.com'
    }
  },
  traits: {
    email: 'test.email@test.com',
    optimizely_vuid: 'vuid identifier'
  },
  properties: {
    email: 'test.email@test.com',
    campaign_id: '123456',
    campaign_name: 'opti-test-campaign',
    link_url: 'https://url-from-email-clicked.com'
  }
})

describe('OptimizelyDataPlatform.emailEvent', () => {
  it('Should fire email event', async () => {
    nock('https://function.zaius.app/twilio_segment').post('/email_event').reply(201)

    const response = await testDestination.testAction('emailEvent', {
      event: emailEvent,
      settings: {
        apiKey: 'abc123',
        region: 'US'
      },
      mapping: {
        user_identifiers: {
          anonymousId: 'anonId1234',
          userId: 'user1234',
          email: 'test@test.com'
        },
        event_type: 'email',
        event_action: 'opened',
        campaign: 'opti-test-campaign',
        timestamp: '2024-03-01T18:11:27.649Z'
      }
    })

    expect(response[0].status).toBe(201)
    expect(response[0].options.body).toMatchInlineSnapshot(`"{\\"type\\":\\"email\\",\\"action\\":\\"opened\\",\\"campaign\\":\\"opti-test-campaign\\",\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test@test.com\\"},\\"campaign_event_value\\":null,\\"timestamp\\":\\"2024-03-01T18:11:27.649Z\\"}"`)
  })
})
