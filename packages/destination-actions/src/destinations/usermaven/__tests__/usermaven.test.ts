import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'

import Definition from '../index'

export const baseUrl = 'https://events.usermaven.com'
export const apiKey = 'fake-api-key'
export const userId = 'fake/user/id'
export const anonymousId = 'fake-anonymous-id'
export const email = 'fake+email@example.com'
export const createdAt = '2021-01-01T00:00:00.000Z'
export const companyName = 'Usermaven'

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
          user_created_at: createdAt,
          user_email: email
        }
      })

      const [response] = await testDestination.testAction('identify', {
        event,
        useDefaultMappings: true,
        mapping: {
          user_email: {
            '@path': '$.traits.user_email'
          },
          user_created_at: {
            '@path': '$.traits.user_created_at'
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
        type: 'track',
        event: 'Test Event',
        userId,
        properties: {
          user_created_at: createdAt,
          user_email: email
        }
      })

      const [response] = await testDestination.testAction('track', {
        event,
        useDefaultMappings: true,
        mapping: {
          user_email: {
            '@path': '$.properties.user_email'
          },
          user_created_at: {
            '@path': '$.properties.user_created_at'
          }
        },
        settings
      })

      expect(response.status).toBe(200)
      expect(response.options.body).toContain(userId)
      expect(response.options.body).toContain('Test Event')
    })
  })

  describe('usermaven.group', () => {
    it('should work', async () => {
      nock(baseUrl).post(`/api/v1/event?token=${settings.api_key}`).reply(200, {})

      const event = createTestEvent({
        groupId: 'fake-group-id',
        type: 'group',
        userId,
        traits: {
          user_created_at: createdAt,
          user_email: email,
          company_name: companyName,
          company_created_at: createdAt
        }
      })

      const [response] = await testDestination.testAction('group', {
        event,
        useDefaultMappings: true,
        mapping: {
          user_email: {
            '@path': '$.traits.user_email'
          },
          user_created_at: {
            '@path': '$.traits.user_created_at'
          },
          company_name: {
            '@path': '$.traits.company_name'
          },
          company_created_at: {
            '@path': '$.traits.company_created_at'
          }
        },
        settings
      })

      expect(response.status).toBe(200)
      expect(response.options.body).toContain(userId)
      expect(response.options.body).toContain('fake-group-id')
    })
  })
})
