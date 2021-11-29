import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)
const settings = {
  pixelId: '123321',
  token: process.env.TOKEN
}
describe('FacebookConversionsApi', () => {
  describe('ViewContent', () => {
    it('should handle a basic event', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Viewed',
        userId: 'abc123',
        timestamp: '1631210063',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com',
          content_category: 'Cookies',
          content_name: "Oreo's Quadruple Stack",
          content_type: 'product',
          content_ids: ['ABC123', 'XYZ789'],
          contents: [
            { id: 'ABC123', quantity: 2 },
            { id: 'XYZ789', quantity: 3 }
          ]
        }
      })

      const responses = await testDestination.testAction('viewContent', {
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
          },
          search_string: {
            '@path': '$.properties.search_string'
          },
          contents: {
            '@path': '$.properties.contents'
          },
          content_ids: {
            '@path': '$.properties.content_ids'
          },
          content_category: {
            '@path': '$.properties.content_category'
          },
          content_type: {
            '@path': '$.properties.content_type'
          },
          content_name: {
            '@path': '$.properties.content_name'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it.only('should handle default mappings', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Viewed',
        userId: 'abc123',
        timestamp: '1631210063',
        properties: {
          action_source: 'email',
          currency: 'USD',
          price: 120000,
          quantity: 1,
          product_id: 'tsla_s_2021',
          query: 'Tesla Model S'
        }
      })

      const responses = await testDestination.testAction('viewContent', {
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
        event: 'Product Viewed',
        userId: '7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068', // Pre -hashed for simplicity
        timestamp: '1631210063',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12
        }
      })

      await expect(
        testDestination.testAction('viewContent', {
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
