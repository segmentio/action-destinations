import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../constants'

const testDestination = createTestIntegration(Destination)
const settings = {
  pixelId: '123321',
  testEventCode: '',
  token: process.env.TOKEN
}
const settingsWithTestEventCode = {
  pixelId: '123321',
  testEventCode: '1234567890',
  token: process.env.TOKEN
}

describe('FacebookConversionsApi', () => {
  describe('Custom', () => {
    it('should fail if no event_name is passed', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

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

      await expect(
        testDestination.testAction('custom', {
          event,
          settings,
          mapping: {
            event_name: {
              '@path': '$.event'
            },
            action_source: { '@path': '$.properties.action_source' }
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'event_time'.")
    })

    it('should fail if an empty event_name is passed', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

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

      await expect(
        testDestination.testAction('custom', {
          event,
          settings,
          mapping: {
            event_name: {
              '@path': '$.event'
            },
            action_source: { '@path': '$.properties.action_source' }
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'event_time'.")
    })

    it('should throw an error for an invalid action_source', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

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

      await expect(
        testDestination.testAction('custom', {
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
        })
      ).rejects.toThrowError('a')
    })

    it('should map a standard identify event to a custom event', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        anonymousId: '507f191e810c19729de860ea',
        context: {
          ip: '8.8.8.8',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36'
        },
        messageId: '022bb90c-bbac-11e4-8dfc-aa07a5b093db',
        receivedAt: '2015-02-23T22:28:55.387Z',
        sentAt: '2015-02-23T22:28:55.111Z',
        timestamp: '2015-02-23T22:28:55.111Z',
        traits: {
          name: 'Peter Gibbons',
          email: 'peter@example.com',
          plan: 'premium',
          logins: 5,
          address: {
            street: '6th St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94103',
            country: 'USA'
          }
        },
        properties: {
          action_source: 'website',
          timestamp: '1633473963'
        },
        type: 'identify',
        userId: '97980cfea0067',
        event: 'identify'
      })

      const responses = await testDestination.testAction('custom', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          action_source: { '@path': '$.properties.action_source' },
          custom_data: { '@path': '$.properties' }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"identify\\",\\"event_time\\":\\"2015-02-23T22:28:55.111Z\\",\\"action_source\\":\\"website\\",\\"event_id\\":\\"022bb90c-bbac-11e4-8dfc-aa07a5b093db\\",\\"user_data\\":{\\"external_id\\":\\"df73b86ff613b9d7008c175ae3c3aa3f2c1ea1674a80cac85274d58048e44127\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36\\"},\\"custom_data\\":{\\"action_source\\":\\"website\\",\\"timestamp\\":\\"1633473963\\"}}]}"`
      )
    })

    it('should send test_event_code if present in settings', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settingsWithTestEventCode.pixelId}`)
        .post(`/events`)
        .reply(201, {})

      const event = createTestEvent({
        anonymousId: '507f191e810c19729de860ea',
        context: {
          ip: '8.8.8.8',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36'
        },
        messageId: '022bb90c-bbac-11e4-8dfc-aa07a5b093db',
        receivedAt: '2015-02-23T22:28:55.387Z',
        sentAt: '2015-02-23T22:28:55.111Z',
        timestamp: '2015-02-23T22:28:55.111Z',
        traits: {
          name: 'Peter Gibbons',
          email: 'peter@example.com',
          plan: 'premium',
          logins: 5,
          address: {
            street: '6th St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94103',
            country: 'USA'
          }
        },
        properties: {
          action_source: 'website',
          timestamp: '1633473963'
        },
        type: 'identify',
        userId: '97980cfea0067',
        event: 'identify'
      })

      const responses = await testDestination.testAction('custom', {
        event,
        settings: settingsWithTestEventCode,
        useDefaultMappings: true,
        mapping: {
          action_source: { '@path': '$.properties.action_source' },
          custom_data: { '@path': '$.properties' }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"identify\\",\\"event_time\\":\\"2015-02-23T22:28:55.111Z\\",\\"action_source\\":\\"website\\",\\"event_id\\":\\"022bb90c-bbac-11e4-8dfc-aa07a5b093db\\",\\"user_data\\":{\\"external_id\\":\\"df73b86ff613b9d7008c175ae3c3aa3f2c1ea1674a80cac85274d58048e44127\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36\\"},\\"custom_data\\":{\\"action_source\\":\\"website\\",\\"timestamp\\":\\"1633473963\\"}}],\\"test_event_code\\":\\"1234567890\\"}"`
      )
    })
  })
})
