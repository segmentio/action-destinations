import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2023-04-17T15:21:15.449Z'
const settings: Settings = {
  accessToken: '2fbe9c55d6a5afbdc3d318c7008f35be1bfae74b',
  eventSetID: '7216325310789304321'
}

describe('Tiktok Offline Conversions', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      // TODO: Test your action. code below is just to allow Linter to pass
      const event = createTestEvent({
        userId: 'testId123'
      })
      expect(event.userId).toBe('testId123')

      nock('https://your.destination.endpoint').get('*').reply(200, {})

      // This should match your authentication.fields
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })

  describe('testTrackNonPaymentOfflineConversion', () => {
    it('should send a successful \'Contact\' event to \'trackNonPaymentOfflineConversion\'', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'User Contacted Call Center',
        messageId: 'test-message-id-contact',
        type: 'track',
        properties: {
          emails: ['testsegmentintegration1@tiktok.com','testsegmentintegration2@tiktok.com'],
          phone_numbers: ['+1555-555-5555','+1555-555-5556'],
          ttclid: 'test-ttclid-contact',
          order_id: 'test-order-id-contact',
          shop_id: 'test-shop-id-contact',
          event_channel: 'email'
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123-contact'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/offline/track/').post('/').reply(200, {});

      const responses = await testDestination.testAction('trackNonPaymentOfflineConversion', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'Contact'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        event_set_id: settings.eventSetID,
        event: 'Contact',
        event_id: event.messageId,
        timestamp: timestamp,
        context: {
          user: {
            emails: ['522a233963af49ceac13a2f68719d86a0b4cfb306b9a7959db697e1d7a52676a', 'c4821c6d488a9a27653e59b7c1f576e1434ed3e11cd0b6b86440fe56ea6c2d97'],
            phone_numbers: ['cba00308ba71ba61fbb0e96f2876fd2cb7eb4e2cfc0e10ec1b90a365b5f026a3','ade95c6dfe84aba970b77f82b924f6276a9aab9937f2598ddedb7d5647bc6041']
          },
          ad: {
            callback: event.properties ? event.properties.ttclid : undefined
          },
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          ip: '0.0.0.0',
          user_agent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
        },
        properties: {
          order_id: 'test-order-id-contact',
          shop_id: 'test-shop-id-contact',
          event_channel: 'email'
        }
      })
    })

    it('should send a successful \'Subscribe\' event to \'trackNonPaymentOfflineConversion\'', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'User Subscribed In Store',
        messageId: 'test-message-id-subscribe',
        type: 'track',
        properties: {
          emails: ['testsegmentintegration1@tiktok.com','testsegmentintegration2@tiktok.com'],
          phone_numbers: ['+1555-555-5555','+1555-555-5556'],
          ttclid: 'test-ttclid-subscribe',
          order_id: 'test-order-id-subscribe',
          shop_id: 'test-shop-id-subscribe',
          event_channel: 'email'
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123-subscribe'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/offline/track/').post('/').reply(200, {});

      const responses = await testDestination.testAction('trackNonPaymentOfflineConversion', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'Subscribe'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        event_set_id: settings.eventSetID,
        event: 'Subscribe',
        event_id: event.messageId,
        timestamp: timestamp,
        context: {
          user: {
            emails: ['522a233963af49ceac13a2f68719d86a0b4cfb306b9a7959db697e1d7a52676a', 'c4821c6d488a9a27653e59b7c1f576e1434ed3e11cd0b6b86440fe56ea6c2d97'],
            phone_numbers: ['cba00308ba71ba61fbb0e96f2876fd2cb7eb4e2cfc0e10ec1b90a365b5f026a3','ade95c6dfe84aba970b77f82b924f6276a9aab9937f2598ddedb7d5647bc6041']
          },
          ad: {
            callback: event.properties ? event.properties.ttclid : undefined
          },
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          ip: '0.0.0.0',
          user_agent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
        },
        properties: {
          order_id: 'test-order-id-subscribe',
          shop_id: 'test-shop-id-subscribe',
          event_channel: 'email'
        }
      })
    })

    it('should send a successful \'SubmitForm\' event to \'trackNonPaymentOfflineConversion\'', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Form Submitted',
        messageId: 'test-message-id-submit-form',
        type: 'track',
        properties: {
          emails: ['testsegmentintegration1@tiktok.com','testsegmentintegration2@tiktok.com'],
          phone_numbers: ['+1555-555-5555','+1555-555-5556'],
          ttclid: 'test-ttclid-submit-form',
          order_id: 'test-order-id-submit-form',
          shop_id: 'test-shop-id-submit-form',
          event_channel: 'email'
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123-submit-form'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/offline/track/').post('/').reply(200, {});

      const responses = await testDestination.testAction('trackNonPaymentOfflineConversion', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'SubmitForm'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        event_set_id: settings.eventSetID,
        event: "SubmitForm",
        event_id: event.messageId,
        timestamp: timestamp,
        context: {
          user: {
            emails: ['522a233963af49ceac13a2f68719d86a0b4cfb306b9a7959db697e1d7a52676a', 'c4821c6d488a9a27653e59b7c1f576e1434ed3e11cd0b6b86440fe56ea6c2d97'],
            phone_numbers: ['cba00308ba71ba61fbb0e96f2876fd2cb7eb4e2cfc0e10ec1b90a365b5f026a3','ade95c6dfe84aba970b77f82b924f6276a9aab9937f2598ddedb7d5647bc6041']
          },
          ad: {
            callback: event.properties ? event.properties.ttclid : undefined
          },
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          ip: '0.0.0.0',
          user_agent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
        },
        properties: {
          order_id: 'test-order-id-submit-form',
          shop_id: 'test-shop-id-submit-form',
          event_channel: 'email'
        }
      })
    })
    
  })

  describe('testTrackPaymentOfflineConversion', () => {
    it('should send a successful \'CompletePayment\' event to \'trackPaymentOfflineConversion\' from array of products', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Order Completed',
        messageId: 'test-message-id-complete-payment',
        type: 'track',
        properties: {
          emails: ['testsegmentintegration1@tiktok.com','testsegmentintegration2@tiktok.com'],
          phone_numbers: ['+1555-555-5555','+1555-555-5556'],
          ttclid: 'test-ttclid-complete-payment',
          order_id: 'test-order-id-complete-payment',
          shop_id: 'test-shop-id-complete-payment',
          event_channel: 'email',
          currency: 'USD',
          value: 100,
          query: 'shoes',
          products: [{ price: 100, quantity: 2, category: 'Air Force One (Size S)', product_id: 'abc123' }]
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123-complete-payment'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/offline/track/').post('/').reply(200, {});

      const responses = await testDestination.testAction('trackPaymentOfflineConversion', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'CompletePayment',
          contents: {
            '@arrayPath': [
              '$.properties.products',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_type: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        event_set_id: settings.eventSetID,
        event: "CompletePayment",
        event_id: event.messageId,
        timestamp: timestamp,
        partner: 'Segment',
        context: {
          user: {
            emails: ['522a233963af49ceac13a2f68719d86a0b4cfb306b9a7959db697e1d7a52676a', 'c4821c6d488a9a27653e59b7c1f576e1434ed3e11cd0b6b86440fe56ea6c2d97'],
            phone_numbers: ['cba00308ba71ba61fbb0e96f2876fd2cb7eb4e2cfc0e10ec1b90a365b5f026a3','ade95c6dfe84aba970b77f82b924f6276a9aab9937f2598ddedb7d5647bc6041']
          },
          ad: {
            callback: event.properties ? event.properties.ttclid : undefined
          },
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          ip: '0.0.0.0',
          user_agent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
        },
        properties: {
          order_id: 'test-order-id-complete-payment',
          shop_id: 'test-shop-id-complete-payment',
          event_channel: 'email',
          contents: [{
            "price": 100,
            "quantity": 2,
            "content_type": "Air Force One (Size S)",
            "content_id": "abc123"
          }],
          currency: 'USD',
          value: 100
        }
      })
    })

    it('should send a successful \'CompletePayment\' event to \'trackPaymentOfflineConversion\' from properties fields', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Order Completed',
        messageId: 'test-message-id-complete-payment',
        type: 'track',
        properties: {
          emails: ['testsegmentintegration1@tiktok.com','testsegmentintegration2@tiktok.com'],
          phone_numbers: ['+1555-555-5555','+1555-555-5556'],
          ttclid: 'test-ttclid-complete-payment',
          order_id: 'test-order-id-complete-payment',
          shop_id: 'test-shop-id-complete-payment',
          event_channel: 'email',
          currency: 'USD',
          value: 100,
          query: 'shoes',
          price: 100,
          quantity: 2,
          category: 'Air Force One (Size S)',
          product_id: 'abc123'
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123-complete-payment'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/offline/track/').post('/').reply(200, {});

      const responses = await testDestination.testAction('trackPaymentOfflineConversion', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event: 'CompletePayment',
          contents: {
            '@arrayPath': [
              '$.properties.products',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_type: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        event_set_id: settings.eventSetID,
        event: "CompletePayment",
        event_id: event.messageId,
        timestamp: timestamp,
        partner: 'Segment',
        context: {
          user: {
            emails: ['522a233963af49ceac13a2f68719d86a0b4cfb306b9a7959db697e1d7a52676a', 'c4821c6d488a9a27653e59b7c1f576e1434ed3e11cd0b6b86440fe56ea6c2d97'],
            phone_numbers: ['cba00308ba71ba61fbb0e96f2876fd2cb7eb4e2cfc0e10ec1b90a365b5f026a3','ade95c6dfe84aba970b77f82b924f6276a9aab9937f2598ddedb7d5647bc6041']
          },
          ad: {
            callback: event.properties ? event.properties.ttclid : undefined
          },
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          ip: '0.0.0.0',
          user_agent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
        },
        properties: {
          order_id: 'test-order-id-complete-payment',
          shop_id: 'test-shop-id-complete-payment',
          event_channel: 'email',
          contents: [{
            "price": 100,
            "quantity": 2,
            "content_type": "Air Force One (Size S)",
            "content_id": "abc123"
          }],
          currency: 'USD',
          value: 100
        }
      })
    })
    
  })
})
