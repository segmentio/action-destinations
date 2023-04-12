import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'

import Definition from '../index'

export const baseUrl = 'https://events.usermaven.com'
export const apiKey = 'fake-api-key'
export const userId = 'fake/user/id'
export const anonymousId = 'fake-anonymous-id'
export const email = 'fake+email@example.com'
export const createdAt = '2021-01-01T00:00:00.000Z'

export const settings = {
  api_key: apiKey
}
const testDestination = createTestIntegration(Definition)

describe('Usermaven', () => {
  describe('testAuthentication', () => {
    it('should authenticate', async () => {
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('usermaven.identify', () => {
    it('should work', async () => {
      nock(baseUrl).post(`/api/v1/event?token=${settings.api_key}`).reply(200, {})

      const event = createTestEvent({
        anonymousId,
        userId,
        traits: {
          id: userId,
          anonymous_id: anonymousId,
          created_at: createdAt,
          email
        }
      })

      const [response] = await testDestination.testAction('identify', {
        event,
        mapping: {
          user: {
            '@path': '$.traits'
          }
        },
        settings
      })

      expect(response.status).toBe(200)
      expect(response.options.body).toContain(userId)
      expect(response.options.body).toContain(anonymousId)
    })
  })

  describe('usermaven.track', () => {
    it('should work', async () => {
      nock(baseUrl).post(`/api/v1/event?token=${settings.api_key}`).reply(200, {})

      const event = createTestEvent({
        anonymousId,
        type: 'track',
        event: 'Test Event',
        userId,
        traits: {
          id: userId,
          anonymous_id: anonymousId,
          created_at: createdAt,
          email
        }
      })

      const [response] = await testDestination.testAction('track', {
        event,
        useDefaultMappings: true,
        mapping: {
          user: {
            '@path': '$.traits'
          },
          event: {
            '@path': '$.event'
          }
        },
        settings
      })

      expect(response.status).toBe(200)
      expect(response.options.body).toContain(userId)
      expect(response.options.body).toContain(anonymousId)
      expect(response.options.body).toContain('Test Event')
    })
  })

  describe('usermaven.group', () => {
    it('should work', async () => {
      nock(baseUrl).post(`/api/v1/event?token=${settings.api_key}`).reply(200, {})

      const event = createTestEvent({
        anonymousId,
        type: 'group',
        userId,
        traits: {
          id: userId,
          anonymous_id: anonymousId,
          created_at: createdAt,
          email
        },
        properties: {
          id: 'group-id',
          name: 'group-name',
          created_at: createdAt
        }
      })

      const [response] = await testDestination.testAction('group', {
        event,
        useDefaultMappings: true,
        mapping: {
          user: {
            '@path': '$.traits'
          },
          company: {
            '@path': '$.properties'
          }
        },
        settings
      })

      expect(response.status).toBe(200)
      expect(response.options.body).toContain(userId)
      expect(response.options.body).toContain(anonymousId)
      expect(response.options.body).toContain('group-id')
      expect(response.options.body).toContain('group-name')
    })
  })
})
