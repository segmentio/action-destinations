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
  describe('InitiateCheckout', () => {
    it('should handle basic mapping overrides', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

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

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"InitiateCheckout\\",\\"event_time\\":\\"1631210000\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12}}]}"`
      )
    })

    it('should throw an error for invalid currency values', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}0/${settings.pixelId}`).post(`/events`).reply(201, {})

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
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Checkout Started',
        timestamp: '1631210020',
        messageId: 'test',
        properties: {
          userId: 'testuser1234',
          action_source: 'email',
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

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"InitiateCheckout\\",\\"event_time\\":\\"1631210020\\",\\"action_source\\":\\"email\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"user_data\\":{\\"external_id\\":\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12,\\"contents\\":[{\\"id\\":\\"123\\",\\"quantity\\":1,\\"item_price\\":100},{\\"id\\":\\"345\\",\\"quantity\\":2,\\"item_price\\":50}]}}]}"`
      )
    })

    it('should throw an error if no user_data keys are included', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

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

    it('should send test_event_code if present in settings', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settingsWithTestEventCode.pixelId}`)
        .post(`/events`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Checkout Started',
        timestamp: '1631210020',
        messageId: 'test',
        properties: {
          userId: 'testuser1234',
          action_source: 'email',
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
        settings: settingsWithTestEventCode,
        useDefaultMappings: true,
        mapping: { action_source: { '@path': '$.properties.action_source' } }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"InitiateCheckout\\",\\"event_time\\":\\"1631210020\\",\\"action_source\\":\\"email\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"user_data\\":{\\"external_id\\":\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12,\\"contents\\":[{\\"id\\":\\"123\\",\\"quantity\\":1,\\"item_price\\":100},{\\"id\\":\\"345\\",\\"quantity\\":2,\\"item_price\\":50}]}}],\\"test_event_code\\":\\"1234567890\\"}"`
      )
    })
  })
})
