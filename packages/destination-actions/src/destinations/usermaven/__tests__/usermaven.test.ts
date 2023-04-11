import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'

import Definition from '../index'

export const baseUrl = 'https://events.usermaven.com'
export const apiKey = 'fake-api-key'
export const serverToken = 'fake-server-token'
export const userId = 'fake/user/id'
export const anonymousId = 'fake-anonymous-id'
export const email = 'fake+email@example.com'
export const createdAt = '2021-01-01T00:00:00.000Z'

export const settings = {
  apiKey,
  serverToken
}
const testDestination = createTestIntegration(Definition)

describe('Usermaven', () => {
  describe('testAuthentication', () => {
    it('makes expected request', async () => {
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('trackEvent', () => {
    it('should validate action fields', async () => {
      nock(baseUrl).post(`/api/v1/s2s/event?token=${settings.apiKey}.${settings.serverToken}`).reply(200, {})

      const event = createTestEvent({
        event: 'Test Event',
        userId
      })

      const [response] = await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true,
        mapping: {
          userId: {
            '@path': '$.userId'
          },
          event: {
            '@path': '$.event'
          }
        },
        settings: settings
      })

      expect(response.status).toBe(200)
      expect(JSON.parse(response.options.body as string)).toEqual({
        api_key: apiKey,
        event_id: '',
        event_type: 'Test Event',
        ids: {},
        user: {
          id: userId
        },
        screen_resolution: '0',
        src: 'usermaven-segment',
        event_attributes: {}
      })
    })
  })

  describe('identifyUser', () => {
    it('should validate action fields', async () => {
      nock(baseUrl).post(`/api/v1/s2s/event?token=${settings.apiKey}.${settings.serverToken}`).reply(200, {})

      const event = createTestEvent({
        anonymousId,
        userId,
        traits: {
          email,
          createdAt
        }
      })

      const [response] = await testDestination.testAction('identifyUser', {
        event,
        useDefaultMappings: true,
        settings
      })

      expect(response.status).toBe(200)
      expect(JSON.parse(response.options.body as string)).toEqual({
        api_key: apiKey,
        event_id: '',
        event_type: 'user_identify',
        ids: {},
        user: {
          id: userId,
          anonymous_id: anonymousId,
          created_at: '2021-01-01T00:00:00.000Z',
          email: 'fake+email@example.com'
        },
        screen_resolution: '0',
        src: 'usermaven-segment'
      })
    })
  })
})
