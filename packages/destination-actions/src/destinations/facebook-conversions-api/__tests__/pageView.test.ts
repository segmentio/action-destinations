import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  pixelId: '123321',
  token: process.env.TOKEN
}
describe('FacebookConversionsApi', () => {
  describe('PageView', () => {
    it('should handle a basic event', async () => {
      nock(`https://graph.facebook.com/v12.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        type: 'page',
        userId: 'abc123',
        properties: {
          timestamp: 1631210000,
          action_source: 'email',
          email: 'nicholas.aguilar@segment.com'
        }
      })

      const responses = await testDestination.testAction('pageView', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { action_source: { '@path': '$.properties.action_source' } }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"PageView\\",\\"event_time\\":\\"2022-03-08T00:29:43.256Z\\",\\"action_source\\":\\"email\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"c8bbf89a-ccf3-4b04-bda6-b2032828d4e3\\",\\"user_data\\":{\\"external_id\\":\\"6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"}}]}"`
      )
    })

    it('should throw an error when action_source is website and no client_user_agent', async () => {
      nock(`https://graph.facebook.com/v12.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        type: 'page',
        userId: 'abc123',
        properties: {
          timestamp: 1631210000,
          action_source: 'website',
          email: 'nicholas.aguilar@segment.com'
        }
      })

      await expect(
        testDestination.testAction('pageView', {
          event,
          settings,
          mapping: {
            action_source: {
              '@path': '$.properties.action_source'
            },
            event_time: {
              '@path': '$.properties.timestamp'
            },
            user_data: {
              email: {
                '@path': '$.properties.email'
              }
            }
          }
        })
      ).rejects.toThrowError('If action source is "Website" then client_user_agent must be defined')
    })

    it('should handle default mappings', async () => {
      nock(`https://graph.facebook.com/v12.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        properties: {
          userId: 'testuser1234',
          action_source: 'email',
          timestamp: 1631210020
        }
      })

      const responses = await testDestination.testAction('pageView', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { action_source: { '@path': '$.properties.action_source' } }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"PageView\\",\\"event_time\\":\\"2022-03-08T00:29:43.364Z\\",\\"action_source\\":\\"email\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"7da6b203-2828-44e3-82ee-796eaf20810e\\",\\"user_data\\":{\\"external_id\\":\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"}}]}"`
      )
    })

    it('should throw an error if no user_data keys are included', async () => {
      nock(`https://graph.facebook.com/v12.0/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
        userId: 'abc123',
        properties: {
          timestamp: 1631210030,
          action_source: 'email'
        }
      })

      await expect(
        testDestination.testAction('pageView', {
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
              '@path': '$.properties.timestamp'
            }
            // No user data mapping included. This should cause action to fail.
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'user_data'.")
    })
  })
})
