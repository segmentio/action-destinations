import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)
const settings = {
  pixelId: '123321',
  token: process.env.TOKEN
}
describe('FacebookConversionsApi', () => {
  describe('InitiateCheckout', () => {
    it('should handle basic mapping overrides', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Checkout Started',
        userId: 'abc123',
        timestamp: '1631210000',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com'
        }
      })

      const responses = await testDestination.testAction('initiateCheckout', {
        event,
        settings,
        mapping: {
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          user_data: {
            email: {
              '@path': '$.properties.email'
            }
          },
          action_source: {
            '@path': '$.properties.action_source'
          },
          event_time: {
            '@path': '$.timestamp'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('should throw an error for invalid currency values', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Checkout Started',
        userId: 'abc123',
        timestamp: '1631210010',
        properties: {
          action_source: 'email',
          currency: 'FAKE',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com'
        }
      })

      await expect(
        testDestination.testAction('initiateCheckout', {
          event,
          settings,
          mapping: {
            currency: {
              '@path': '$.properties.currency'
            },
            value: {
              '@path': '$.properties.value'
            },
            user_data: {
              email: {
                '@path': '$.properties.email'
              }
            },
            action_source: {
              '@path': '$.properties.action_source'
            },
            event_time: {
              '@path': '$.timestamp'
            }
          }
        })
      ).rejects.toThrowError('FAKE is not a valid currency code.')
    })

    it('should handle default mappings', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Checkout Started',
        properties: {
          userId: 'testuser1234',
          action_source: 'email',
          timestamp: '1631210020',
          currency: 'USD',
          revenue: 12.12,
          products: [
            { product_id: '123', quantity: 1, price: 100 },
            { product_id: '345', quantity: 2, price: 50 }
          ]
        }
      })

      const responses = await testDestination.testAction('initiateCheckout', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { action_source: { '@path': '$.properties.action_source' } }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('should throw an error if no user_data keys are included', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Checkout Started',
        userId: 'abc123', // Pre -hashed for simplicity
        timestamp: '1631210063',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12
        }
      })

      await expect(
        testDestination.testAction('initiateCheckout', {
          event,
          settings,
          mapping: {
            currency: {
              '@path': '$.properties.currency'
            },
            value: {
              '@path': '$.properties.value'
            },
            action_source: {
              '@path': '$.properties.action_source'
            },
            event_time: {
              '@path': '$.timestamp'
            }
            // No user data mapping included. This should cause action to fail.
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'user_data'.")
    })
  })
})
