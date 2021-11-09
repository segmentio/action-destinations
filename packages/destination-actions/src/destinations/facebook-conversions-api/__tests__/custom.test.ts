import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)
const settings = {
  pixelId: '123321',
  token: process.env.TOKEN
}

describe.only('FacebookConversionsApi', () => {
  describe('Custom', () => {
    it('should fail if no event_name is passed', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
      .post(`/events`)
      .reply(201, {})

      const event = createTestEvent({
        userId: 'abc123',
        timestamp: '1631210010',
        properties: {
          action_source: 'email',
          currency: 'FAKE',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com'
        }
      })

      await expect(testDestination.testAction('custom', {
        event,
        settings,
        mapping: {
          event_name: {
            '@path': '$.event'
          }
        }
      })).rejects.toThrowError("The root value is missing the required field 'event_time'.")
    })

    it('should fail if an empty event_name is passed', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
      .post(`/events`)
      .reply(201, {})

      const event = createTestEvent({
        event: '',
        userId: 'abc123',
        timestamp: '1631210010',
        properties: {
          action_source: 'email',
          currency: 'FAKE',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com'
        }
      })

      await expect(testDestination.testAction('custom', {
        event,
        settings,
        mapping: {
          event_name: {
            '@path': '$.event'
          }
        }
      })).rejects.toThrowError("The root value is missing the required field 'event_time'.")
    })

    it('should throw an error for an invalid action_source', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
      .post(`/events`)
      .reply(201, {})

        const event = createTestEvent({
          event: 'custom',
          userId: 'abc123',
          timestamp: '1631210010',
          properties: {
            action_source: 'fake',
            currency: 'USD',
            value: 12.12,
            email: 'nicholas.aguilar@segment.com'
          }
        })

        await expect(testDestination.testAction('custom', {
          event,
          settings,
          mapping: {
            event_name: {
              '@path': '$.event'
            },
            action_source: {
              '@path': '$.properties.action_source'
            },
            event_time: {
              '@path': '$.timestamp'
            }
          }
        })).rejects.toThrowError("a")
    })

    it('should map a standard identify event to a custom event', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
      .post(`/events`)
      .reply(201, {})

      const event = createTestEvent({
          anonymousId: "507f191e810c19729de860ea",
          context: {
            "ip": "8.8.8.8",
            "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36"
          },
          messageId: "022bb90c-bbac-11e4-8dfc-aa07a5b093db",
          receivedAt: "2015-02-23T22:28:55.387Z",
          sentAt: "2015-02-23T22:28:55.111Z",
          timestamp: "2015-02-23T22:28:55.111Z",
          traits: {
            name: "Peter Gibbons",
            email: "peter@example.com",
            plan: "premium",
            logins: 5,
            address: {
              street: "6th St",
              city: "San Francisco",
              state: "CA",
              postalCode: "94103",
              country: "USA"
            }
          },
          properties: {
            action_source: 'website',
            timestamp: '1633473963'
          },
          type: "identify",
          userId: "97980cfea0067",
          event: "identify"
      })

      const responses = await testDestination.testAction('custom', {
        event,
        settings,
        useDefaultMappings: true
      })
      
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })
  })
})
