import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2023-04-17T15:21:15.449Z'
const settings: Settings = {
  accessToken: 'test-token',
  eventSetID: 'test-event-set-id'
}

describe('Tiktok Offline Conversions', () => {
  describe('testTrackNonPaymentOfflineConversion', () => {
    it("should send a successful 'Contact' event to 'trackNonPaymentOfflineConversion'", async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'User Contacted Call Center',
        messageId: 'test-message-id-contact',
        type: 'track',
        properties: {
          email: ['testsegmentintegration1@tiktok.com', 'testsegmentintegration2@tiktok.com'],
          phone: ['+1555-555-5555', '+1555-555-5556'],
          ttclid: 'test-ttclid-contact',
          order_id: 'test-order-id-contact',
          shop_id: 'test-shop-id-contact',
          event_channel: 'in_store'
        },
        userId: 'testId123-contact'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/offline/track/').post('/').reply(200, {})

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
        partner_name: 'Segment',
        context: {
          user: {
            emails: [
              '522a233963af49ceac13a2f68719d86a0b4cfb306b9a7959db697e1d7a52676a',
              'c4821c6d488a9a27653e59b7c1f576e1434ed3e11cd0b6b86440fe56ea6c2d97'
            ],
            phone_numbers: [
              '910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0',
              '46563a86074ccb92653d9f0666885030f5e921563bfa19c423b60a8c9ef7f85e'
            ]
          }
        },
        properties: {
          order_id: 'test-order-id-contact',
          shop_id: 'test-shop-id-contact',
          event_channel: 'in_store'
        }
      })
    })

    it("should send a successful 'Subscribe' event to 'trackNonPaymentOfflineConversion'", async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'User Subscribed In Store',
        messageId: 'test-message-id-subscribe',
        type: 'track',
        properties: {
          email: ['testsegmentintegration1@tiktok.com', 'testsegmentintegration2@tiktok.com'],
          phone: ['+1555-555-5555', '+1555-555-5556'],
          ttclid: 'test-ttclid-subscribe',
          order_id: 'test-order-id-subscribe',
          shop_id: 'test-shop-id-subscribe',
          event_channel: 'in_store'
        },
        userId: 'testId123-subscribe'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/offline/track/').post('/').reply(200, {})

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
        partner_name: 'Segment',
        context: {
          user: {
            emails: [
              '522a233963af49ceac13a2f68719d86a0b4cfb306b9a7959db697e1d7a52676a',
              'c4821c6d488a9a27653e59b7c1f576e1434ed3e11cd0b6b86440fe56ea6c2d97'
            ],
            phone_numbers: [
              '910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0',
              '46563a86074ccb92653d9f0666885030f5e921563bfa19c423b60a8c9ef7f85e'
            ]
          }
        },
        properties: {
          order_id: 'test-order-id-subscribe',
          shop_id: 'test-shop-id-subscribe',
          event_channel: 'in_store'
        }
      })
    })

    it("should send a successful 'SubmitForm' event to 'trackNonPaymentOfflineConversion'", async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Form Submitted',
        messageId: 'test-message-id-submit-form',
        type: 'track',
        properties: {
          email: ['testsegmentintegration1@tiktok.com', 'testsegmentintegration2@tiktok.com'],
          phone: ['+1555-555-5555', '+1555-555-5556'],
          order_id: 'test-order-id-submit-form',
          shop_id: 'test-shop-id-submit-form',
          event_channel: 'in_store'
        },
        userId: 'testId123-submit-form'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/offline/track/').post('/').reply(200, {})

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
        event: 'SubmitForm',
        event_id: event.messageId,
        timestamp: timestamp,
        partner_name: 'Segment',
        context: {
          user: {
            emails: [
              '522a233963af49ceac13a2f68719d86a0b4cfb306b9a7959db697e1d7a52676a',
              'c4821c6d488a9a27653e59b7c1f576e1434ed3e11cd0b6b86440fe56ea6c2d97'
            ],
            phone_numbers: [
              '910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0',
              '46563a86074ccb92653d9f0666885030f5e921563bfa19c423b60a8c9ef7f85e'
            ]
          }
        },
        properties: {
          order_id: 'test-order-id-submit-form',
          shop_id: 'test-shop-id-submit-form',
          event_channel: 'in_store'
        }
      })
    })
  })

  describe('testTrackPaymentOfflineConversion', () => {
    it("should send a successful 'CompletePayment' event to 'trackPaymentOfflineConversion' from array of products", async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Order Completed',
        messageId: 'test-message-id-complete-payment',
        type: 'track',
        properties: {
          email: ['testsegmentintegration1@tiktok.com', 'testsegmentintegration2@tiktok.com'],
          phone: ['+1555-555-5555', '+1555-555-5556'],
          order_id: 'test-order-id-complete-payment',
          shop_id: 'test-shop-id-complete-payment',
          event_channel: 'in_store',
          currency: 'USD',
          value: 100,
          query: 'shoes',
          products: [{ price: 100, quantity: 2, category: 'Air Force One (Size S)', product_id: 'abc123' }]
        },
        userId: 'testId123-complete-payment'
      })

      nock('https://business-api.tiktok.com/open_api/v1.3/offline/track/').post('/').reply(200, {})

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
        event: 'CompletePayment',
        event_id: event.messageId,
        timestamp: timestamp,
        partner_name: 'Segment',
        context: {
          user: {
            emails: [
              '522a233963af49ceac13a2f68719d86a0b4cfb306b9a7959db697e1d7a52676a',
              'c4821c6d488a9a27653e59b7c1f576e1434ed3e11cd0b6b86440fe56ea6c2d97'
            ],
            phone_numbers: [
              '910a625c4ba147b544e6bd2f267e130ae14c591b6ba9c25cb8573322dedbebd0',
              '46563a86074ccb92653d9f0666885030f5e921563bfa19c423b60a8c9ef7f85e'
            ]
          }
        },
        properties: {
          order_id: 'test-order-id-complete-payment',
          shop_id: 'test-shop-id-complete-payment',
          event_channel: 'in_store',
          contents: [
            {
              price: 100,
              quantity: 2,
              content_type: 'Air Force One (Size S)',
              content_id: 'abc123'
            }
          ],
          currency: 'USD',
          value: 100
        }
      })
    })
  })
})
