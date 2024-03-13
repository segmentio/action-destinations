import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const productEvent = createTestEvent({
  type: 'track',
  event: 'custom',
  timestamp: '2024-02-09T15:30:51.046Z',
  properties: {
    custom_field: 'hello',
    custom_field_num: 12345
  }
})

describe('OptimizelyDataPlatform.nonEcommCustomEvent', () => {
  it('Should fire non ecomm custom event', async () => {
    nock('https://function.zaius.app/twilio_segment').post('/custom_event').reply(201, {})

    const response = await testDestination.testAction('nonEcommCustomEvent', {
      event: productEvent,
      settings: {
        apiKey: 'abc123',
        region: 'US'
      },
      mapping: {
        user_identifiers: {
          anonymousId: 'anonId1234',
          userId: 'user1234'
        },
        event_type: 'custom',
        event_action: 'custom',
        timestamp: '2024-02-09T15:30:51.046Z',
        data: {
          custom_field: 'hello',
          custom_field_num: 12345
        }
      }
    })

    expect(response[0].status).toBe(201)
    expect(response[0].options.body).toMatchInlineSnapshot(
      `"{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\"},\\"action\\":\\"custom\\",\\"type\\":\\"custom\\",\\"timestamp\\":\\"2024-02-09T15:30:51.046Z\\",\\"data\\":{\\"custom_field\\":\\"hello\\",\\"custom_field_num\\":12345}}"`
    )
  })
})
