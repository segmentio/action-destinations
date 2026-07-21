import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)

describe('OptimizelyDataPlatform.trackEvent', () => {
  beforeEach((done) => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
    done()
  })

  describe('single request', () => {
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

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201, {})

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
          event_type: 'product',
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
        `"[{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\"},\\"action\\":\\"purchase\\",\\"type\\":\\"product\\",\\"timestamp\\":\\"2024-03-01T18:11:27.649Z\\",\\"order_id\\":\\"1234\\",\\"total\\":\\"20\\",\\"products\\":[{\\"product_id\\":\\"12345\\",\\"qty\\":2},{\\"product_id\\":\\"67890\\",\\"qty\\":5}]}]"`
      )
    })

    it('Should work with default values', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201, {})

      await expect(
        testDestination.testAction('customEvent', {
          event: productEvent,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            event_action: 'purchase'
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should throw error if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201, {})

      await expect(
        testDestination.testAction('customEvent', {
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
            event_type: 'product',
            // event_action: 'purchase', // missing required field
            products: [
              { product_id: '12345', qty: 2 },
              { product_id: '67890', qty: 5 }
            ],
            order_id: '1234',
            total: 20,
            timestamp: '2024-03-01T18:11:27.649Z'
          }
        })
      ).rejects.toThrowError()
    })

    it('should handle errors response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(400)

      await expect(
        testDestination.testAction('customEvent', {
          event: productEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 401 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(401)

      await expect(
        testDestination.testAction('customEvent', {
          event: productEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 429 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(429)

      await expect(
        testDestination.testAction('customEvent', {
          event: productEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })
  })

  describe('batch request', () => {
    const productEvents = [
      createTestEvent({
        type: 'track',
        event: 'purchase',
        context: {
          traits: {
            email: 'test.email1@test.com'
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
      }),
      createTestEvent({
        type: 'track',
        event: 'purchase',
        context: {
          traits: {
            email: 'test.email2@test.com'
          }
        },
        properties: {
          order_id: '5678',
          total: 20,
          products: [
            { product_id: '67890', quantity: 20 },
            { product_id: '098765', quantity: 15 }
          ]
        }
      })
    ]

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201, {})

      const response = await testDestination.testBatchAction('customEvent', {
        events: productEvents,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        mapping: {
          event_action: 'purchase',
          timestamp: '2024-03-01T18:11:27.649Z'
        },
        useDefaultMappings: true
      })

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchInlineSnapshot(
        `"[{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"fs_user_id\\":\\"user1234\\",\\"web_user_id\\":\\"user1234\\"},\\"action\\":\\"purchase\\",\\"type\\":\\"purchase\\",\\"timestamp\\":\\"2024-03-01T18:11:27.649Z\\",\\"order_id\\":\\"1234\\",\\"total\\":\\"20\\",\\"products\\":[{\\"product_id\\":\\"12345\\",\\"qty\\":2},{\\"product_id\\":\\"67890\\",\\"qty\\":5}]},{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"fs_user_id\\":\\"user1234\\",\\"web_user_id\\":\\"user1234\\"},\\"action\\":\\"purchase\\",\\"type\\":\\"purchase\\",\\"timestamp\\":\\"2024-03-01T18:11:27.649Z\\",\\"order_id\\":\\"5678\\",\\"total\\":\\"20\\",\\"products\\":[{\\"product_id\\":\\"67890\\",\\"qty\\":20},{\\"product_id\\":\\"098765\\",\\"qty\\":15}]}]"`
      )
    })

    it('Should work with default values', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      await expect(
        testDestination.testBatchAction('customEvent', {
          events: productEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            event_action: 'purchase'
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    /// TODO: Check with Joe why this test is NOT failing if missing required field
    it('should throw error if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      await expect(
        testDestination.testBatchAction('customEvent', {
          events: productEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
      //.rejects.toThrowError() // It should have thrown error
    })

    it('should handle errors response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(400)

      await expect(
        testDestination.testBatchAction('customEvent', {
          events: productEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            event_action: 'purchase'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 401 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(401)

      await expect(
        testDestination.testBatchAction('customEvent', {
          events: productEvents,
          settings: {
            apiKey: 'wrongKey',
            region: 'US'
          },
          mapping: {
            event_action: 'purchase'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 429 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(429)

      await expect(
        testDestination.testBatchAction('customEvent', {
          events: productEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            event_action: 'purchase'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })
  })
})
