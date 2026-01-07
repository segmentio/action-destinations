import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL, API_VERSION } from '../../index'

const testDestination = createTestIntegration(Destination)

const defaultSettings = {
  username: 'test-api-key',
  password: 'test-api-secret',
  twilioAccount: 'AC1234567890'
}

const defaultMapping = {
  memora_store: 'test-store-id',
  contact: {
    email: { '@path': '$.traits.email' },
    firstName: { '@path': '$.traits.first_name' },
    lastName: { '@path': '$.traits.last_name' },
    phone: { '@path': '$.traits.phone' }
  }
}

describe('Memora.upsertProfile', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('perform (single profile)', () => {
    it('should send a profile with contact traits to Memora', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1-555-0100'
        }
      })

      let capturedBody: Record<string, unknown> = {}
      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`, (body) => {
          capturedBody = body as Record<string, unknown>
          return true
        })
        .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
        .reply(202, { success: true })

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)

      // Validate the captured body
      const profiles = capturedBody.profiles as Array<{ traits: { Contact: Record<string, unknown> } }>
      expect(profiles).toHaveLength(1)
      expect(profiles[0].traits.Contact).toEqual({
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0100'
      })
    })

    it('should send profile with partial contact information', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-456',
        traits: {
          email: 'jane@example.com'
        }
      })

      let capturedBody: Record<string, unknown> = {}
      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`, (body) => {
          capturedBody = body as Record<string, unknown>
          return true
        })
        .reply(202, { success: true })

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)

      // Validate the captured body
      const profiles = capturedBody.profiles as Array<{ traits: { Contact: Record<string, unknown> } }>
      expect(profiles).toHaveLength(1)
      expect(profiles[0].traits.Contact).toEqual({
        email: 'jane@example.com'
      })
    })

    it('should throw error when memora_store is missing', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: {
            contact: defaultMapping.contact
          },
          useDefaultMappings: true
        })
      ).rejects.toThrow('Memora Store is required')
    })

    it('should throw error when profile has no traits', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {}
      })

      nock(BASE_URL).put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`).reply(202, { success: true })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: {
            memora_store: 'test-store-id',
            contact: {}
          },
          useDefaultMappings: false
        })
      ).rejects.toThrow('Profile must contain at least one trait group or contact field')
    })

    it('should not include X-Pre-Auth-Context header when twilioAccount is not provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .matchHeader('X-Pre-Auth-Context', (val) => val === undefined)
        .reply(202, { success: true })

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: {
          username: 'test-api-key',
          password: 'test-api-secret'
        },
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
    })
  })

  describe('performBatch (multiple profiles)', () => {
    it('should send multiple profiles in a batch', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          traits: {
            email: 'user1@example.com',
            first_name: 'User',
            last_name: 'One'
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-2',
          traits: {
            email: 'user2@example.com',
            first_name: 'User',
            last_name: 'Two'
          }
        })
      ]

      let capturedBody: Record<string, unknown> = {}
      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`, (body) => {
          capturedBody = body as Record<string, unknown>
          return true
        })
        .reply(202, { success: true })

      const responses = await testDestination.testBatchAction('upsertProfile', {
        events,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)

      // Validate the captured body
      const profiles = capturedBody.profiles as Array<{ traits: { Contact: Record<string, unknown> } }>
      expect(profiles).toHaveLength(2)
      expect(profiles[0].traits.Contact.email).toBe('user1@example.com')
      expect(profiles[1].traits.Contact.email).toBe('user2@example.com')
    })

    it('should throw error when batch is empty', async () => {
      await expect(
        testDestination.testBatchAction('upsertProfile', {
          events: [],
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'invalid-email'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .reply(400, { message: 'Invalid email format' })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })

    it('should handle 404 Not Found errors', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/invalid-store/Profiles/Bulk`)
        .reply(404, { message: 'Store not found' })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: {
            ...defaultMapping,
            memora_store: 'invalid-store'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })

    it('should handle 429 Rate Limit errors as retryable', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .reply(429, { message: 'Rate limit exceeded' }, { 'retry-after': '60' })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })

    it('should handle 500 Internal Server errors as retryable', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .reply(500, { message: 'Internal server error' })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })

    it('should handle 503 Service Unavailable errors as retryable', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .reply(503, { message: 'Service unavailable' })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })
  })
})
