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
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

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
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

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

      await expect(
        testDestination.testAction('addToCart', {
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
        event: 'Product Added',
        properties: {
          userId: 'testuser1234',
          action_source: 'email',
          timestamp: '1631210020',
          currency: 'USD',
          product_id: 'abc12345',
          quantity: 1,
          price: 100
        }
      })

      const responses = await testDestination.testAction('addToCart', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { action_source: { '@path': '$.properties.action_source' } }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('should throw an error if no id parameter is included in contents array objects', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210030',
        properties: {
          email: 'test@test.com',
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          quantity: 1204,
          delivery_category: 'drone'
        }
      })

      await expect(
        testDestination.testAction('addToCart', {
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
            },
            contents: [
              {
                quantity: {
                  '@path': '$.properties.quantity'
                },
                delivery_category: {
                  '@path': '$.properties.delivery_category'
                }
              }
            ],
            user_data: {
              email: {
                '@path': '$.properties.email'
              }
            }
          }
        })
      ).rejects.toThrowError("Contents objects must include an 'id' parameter.")
    })

    it('should throw an error if contents.delivery_category is not supported', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        timestamp: '1631210030',
        properties: {
          email: 'test@test.com',
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          id: 'abc123',
          quantity: 1204,
          delivery_category: 'submarine'
        }
      })

      await expect(
        testDestination.testAction('addToCart', {
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
            },
            contents: [
              {
                id: {
                  '@path': '$.properties.id'
                },
                quantity: {
                  '@path': '$.properties.quantity'
                },
                delivery_category: {
                  '@path': '$.properties.delivery_category'
                }
              }
            ],
            user_data: {
              email: {
                '@path': '$.properties.email'
              }
            }
          }
        })
      ).rejects.toThrowError('contents[0].delivery_category must be one of {in_store, home_delivery, curbside}.')
    })

    it('should throw an error if no user_data keys are included', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`).post(`/events`).reply(201, {})

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

      await expect(
        testDestination.testAction('addToCart', {
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
