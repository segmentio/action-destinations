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
  describe('Search', () => {
    it('should handle a basic event', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Products Searched',
        userId: 'abc123',
        timestamp: '1631210063',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com',
          content_category: 'Cookies',
          content_ids: ['ABC123', 'XYZ789'],
          contents: [
            { id: 'ABC123', quantity: 2 },
            { id: 'XYZ789', quantity: 3 }
          ],
          search_string: 'Oreo`s Quadruple Stack'
        }
      })

      const responses = await testDestination.testAction('search', {
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
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"Search\\",\\"event_time\\":\\"1631210063\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"content_ids\\":[\\"ABC123\\",\\"XYZ789\\"],\\"contents\\":[{\\"id\\":\\"ABC123\\",\\"quantity\\":2},{\\"id\\":\\"XYZ789\\",\\"quantity\\":3}],\\"content_category\\":\\"Cookies\\",\\"value\\":12.12,\\"search_string\\":\\"Oreo\`s Quadruple Stack\\"}}]}"`
      )
    })

    it('should handle default mappings', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Products Searched',
        messageId: 'test',
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

      const responses = await testDestination.testAction('search', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { action_source: { '@path': '$.properties.action_source' } }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"Search\\",\\"event_time\\":\\"1631210063\\",\\"action_source\\":\\"email\\",\\"event_id\\":\\"test\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"user_data\\":{\\"external_id\\":\\"6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"contents\\":[{\\"id\\":\\"tsla_s_2021\\",\\"quantity\\":1,\\"item_price\\":120000}],\\"search_string\\":\\"Tesla Model S\\"}}]}"`
      )
    })

    it('should throw an error if no user_data keys are included', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Products Searched',
        userId: '7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068', // Pre -hashed for simplicity
        timestamp: '1631210063',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12
        }
      })

      await expect(
        testDestination.testAction('search', {
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

    it('should send test_event_code if present in settings', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settingsWithTestEventCode.pixelId}`)
        .post(`/events`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Products Searched',
        userId: 'abc123',
        timestamp: '1631210063',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com',
          content_category: 'Cookies',
          content_ids: ['ABC123', 'XYZ789'],
          contents: [
            { id: 'ABC123', quantity: 2 },
            { id: 'XYZ789', quantity: 3 }
          ],
          search_string: 'Oreo`s Quadruple Stack'
        }
      })

      const responses = await testDestination.testAction('search', {
        event,
        settings: settingsWithTestEventCode,
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
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"Search\\",\\"event_time\\":\\"1631210063\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"content_ids\\":[\\"ABC123\\",\\"XYZ789\\"],\\"contents\\":[{\\"id\\":\\"ABC123\\",\\"quantity\\":2},{\\"id\\":\\"XYZ789\\",\\"quantity\\":3}],\\"content_category\\":\\"Cookies\\",\\"value\\":12.12,\\"search_string\\":\\"Oreo\`s Quadruple Stack\\"}}],\\"test_event_code\\":\\"1234567890\\"}"`
      )
    })
  })
})
