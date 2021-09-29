import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  pixelId: '123321',
  token: process.env.TOKEN
}
describe('FacebookConversionsApi', () => {
  describe('AddToCart', () => {
    it('should handle a basic event', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
      .post(`/events?access_token=${settings.token}`)
      .reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210000',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com'
        }
      })

      const responses = await testDestination.testAction('addToCart', {
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
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
      .post(`/events?access_token=${settings.token}`)
      .reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210010',
        properties: {
          action_source: 'email',
          currency: 'FAKE',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com'
        }
      })

      await expect(testDestination.testAction('addToCart', {
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
      })).rejects.toThrowError('FAKE is not a valid currency code.')
    })

    it('should handle default mappings', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
      .post(`/events?access_token=${settings.token}`)
      .reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        properties: {
          userId: ['testuser1234'],
          action_source: 'email',
          timestamp: '1631210020',
          currency: 'USD',
          revenue: 12.12,
        }
      })
      
      const responses = await testDestination.testAction('addToCart', {
        event,
        settings,
        useDefaultMappings: true
      })
      
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('should throw an error if no user_data keys are included', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
        .post(`/events?access_token=${process.env.TOKEN}`)
        .reply(201, {})
  
      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210030',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12
        }
      })
  
      await expect(testDestination.testAction('addToCart', {
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
      })).rejects.toThrowError('Must include at least one user data property')
    })
  })
})
