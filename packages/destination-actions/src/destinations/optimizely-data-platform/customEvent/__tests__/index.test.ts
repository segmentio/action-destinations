import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)

describe('OptimizelyDataPlatform.trackEvent', () => {
  beforeEach((done) => {
    // Re-Initialize the destination before each test
    // This is done to mitigate a bug where action responses persist into other tests
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
    done()
  })
  describe('perform', () => {
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

    const requestData = {
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
    }

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      const response = await testDestination.testAction('customEvent', requestData)

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchSnapshot()
    })

    it('Should handle 401 error', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(401)

      await expect(testDestination.testAction('customEvent', requestData)).rejects.toThrowError()
    })
  })
})
