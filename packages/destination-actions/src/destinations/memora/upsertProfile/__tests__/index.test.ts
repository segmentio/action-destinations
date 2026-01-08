import nock from 'nock'
import { createTestEvent, createTestIntegration, RetryableError, IntegrationError } from '@segment/actions-core'
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
      ).rejects.toThrow()
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

    it('should throw error when API returns non-202 status', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL).put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`).reply(200, { success: true })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected IntegrationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError)
        expect((error as IntegrationError).message).toBe('Unexpected response status: 200')
        expect((error as IntegrationError).status).toBe(200)
      }
    })
  })

  describe('performBatch (multiple profiles)', () => {
    it('should send multiple profiles in a batch', async () => {
      nock.cleanAll() // Ensure no leftover mocks

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

      expect(responses[responses.length - 1].status).toBe(202)

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

    it('should throw error when a profile in batch has no traits', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          traits: {}
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-2',
          traits: {
            email: 'user2@example.com'
          }
        })
      ]

      nock(BASE_URL).put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`).reply(202, { success: true })

      await expect(
        testDestination.testBatchAction('upsertProfile', {
          events,
          settings: defaultSettings,
          mapping: {
            memora_store: 'test-store-id',
            contact: {}
          },
          useDefaultMappings: false
        })
      ).rejects.toThrow('Profile at index 0 must contain at least one trait group or contact field')
    })

    it('should throw error when batch API returns non-202 status', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          traits: {
            email: 'user1@example.com'
          }
        })
      ]

      nock(BASE_URL).put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`).reply(200, { success: true })

      try {
        await testDestination.testBatchAction('upsertProfile', {
          events,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected IntegrationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError)
        expect((error as IntegrationError).message).toBe('Unexpected response status: 200')
      }
    })
  })

  describe('error handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .reply(400, { message: 'Invalid profile data' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected IntegrationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError)
        expect((error as IntegrationError).message).toBe('Invalid profile data')
        expect((error as IntegrationError).code).toBe('INVALID_REQUEST_DATA')
        expect((error as IntegrationError).status).toBe(400)
      }
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
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .reply(404, { message: 'Store not found' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected IntegrationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError)
        expect((error as IntegrationError).message).toBe('Store not found')
        expect((error as IntegrationError).code).toBe('SERVICE_NOT_FOUND')
        expect((error as IntegrationError).status).toBe(404)
      }
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

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected RetryableError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        expect((error as RetryableError).message).toBe('Rate limit exceeded')
      }
    })

    it('should handle 429 Rate Limit with retry-after header', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL).put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`).reply(429, {}, { 'retry-after': '120' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected RetryableError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        // Message should mention rate limit
        expect((error as RetryableError).message).toContain('Rate limit')
      }
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

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected RetryableError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        expect((error as RetryableError).message).toBe('Internal server error')
      }
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

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected RetryableError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        expect((error as RetryableError).message).toBe('Service unavailable')
      }
    })

    it('should handle other HTTP errors with default message', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL).put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`).reply(418, {})

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected IntegrationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError)
        expect((error as IntegrationError).message).toBe('HTTP 418 error')
        expect((error as IntegrationError).code).toBe('API_ERROR')
        expect((error as IntegrationError).status).toBe(418)
      }
    })

    it('should handle network errors as retryable', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .replyWithError({ message: 'Network timeout', code: 'ETIMEDOUT' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected RetryableError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        expect((error as RetryableError).message).toContain('Network')
      }
    })
  })
})
