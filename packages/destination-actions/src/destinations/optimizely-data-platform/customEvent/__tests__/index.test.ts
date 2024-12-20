import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const productEvent = createTestEvent({
  type: 'track',
  event: 'purchase',
  context: {
    traits: {
      email: 'test.email@test.com'
    }
  },
  properties: {
    order_id: '1234',
    total: 20,
    products: [
      { product_id: '12345', quantity: 2 },
      { product_id: '67890', quantity: 5 }
    ]
  }
})

describe('OptimizelyDataPlatform.trackEvent', () => {
  it('Should fire custom event', async () => {
    nock('https://function.zaius.app/twilio_segment').post('/custom_event').reply(201, {})

    const response = await testDestination.testAction('customEvent', {
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
        event_type: 'whatever',
        event_action: 'purchase',
        products: [
          { product_id: '12345', qty: 2 },
          { product_id: '67890', qty: 5 }
        ],
        order_id: '1234',
        total: 20,
        timestamp: '2024-03-01T18:11:27.649Z'
      }
    })

    expect(response[0].status).toBe(201)
    expect(response[0].options.body).toMatchInlineSnapshot(
      `"{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\"},\\"action\\":\\"purchase\\",\\"type\\":\\"whatever\\",\\"timestamp\\":\\"2024-03-01T18:11:27.649Z\\",\\"order_id\\":\\"1234\\",\\"total\\":\\"20\\",\\"products\\":[{\\"product_id\\":\\"12345\\",\\"qty\\":2},{\\"product_id\\":\\"67890\\",\\"qty\\":5}]}"`
    )
  })
})
