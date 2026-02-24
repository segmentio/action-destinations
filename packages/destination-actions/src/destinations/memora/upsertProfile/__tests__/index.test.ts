import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import type { RequestClient, ExecuteInput, Logger } from '@segment/actions-core'
import Destination from '../../index'
import { API_VERSION } from '../../versioning-info'
import { BASE_URL } from '../../constants'
import type { Payload } from '../generated-types'
import type { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

const defaultSettings = {
  username: 'test-api-key',
  password: 'test-api-secret',
  twilioAccount: 'AC1234567890'
}

const defaultMapping = {
  memora_store: 'test-store-id',
  contact_identifiers: {
    email: { '@path': '$.properties.email' },
    phone: { '@path': '$.properties.phone' }
  },
  contact_traits: {
    firstName: { '@path': '$.properties.first_name' },
    lastName: { '@path': '$.properties.last_name' }
  }
}

describe('Memora.upsertProfile', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('perform (single profile)', () => {
    it('should upsert a profile with contact traits via bulk API', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
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
        .reply(202)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)

      // Validate the bulk upsert request body
      expect(capturedBody.profiles).toHaveLength(1)
      const profile = (capturedBody.profiles as any[])[0]
      expect(profile.traits.Contact).toBeDefined()
      expect(profile.traits.Contact.email).toBe('john@example.com')
      expect(profile.traits.Contact.phone).toBe('+1-555-0100')
      expect(profile.traits.Contact.firstName).toBe('John')
      expect(profile.traits.Contact.lastName).toBe('Doe')
    })

    it('should upsert profile with partial contact information', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-456',
        properties: {
          email: 'jane@example.com',
          first_name: 'Jane'
        }
      })

      let capturedBody: Record<string, unknown> = {}

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`, (body) => {
          capturedBody = body as Record<string, unknown>
          return true
        })
        .reply(202)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)

      // Validate bulk upsert content
      const profile = (capturedBody.profiles as any[])[0]
      expect(profile.traits.Contact.email).toBe('jane@example.com')
      expect(profile.traits.Contact.firstName).toBe('Jane')
    })

    it('should throw error when memora_store is missing', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: {
            contact_identifiers: defaultMapping.contact_identifiers
          },
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })

    it('should throw error when profile has no identifiers', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {}
      })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: {
            memora_store: 'test-store-id',
            contact_identifiers: {},
            contact_traits: {
              firstName: { '@path': '$.properties.first_name' }
            }
          },
          useDefaultMappings: false
        })
      ).rejects.toThrow('No valid profiles found for import')
    })

    it('should throw error when profile has no traits', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: {
            memora_store: 'test-store-id',
            contact_identifiers: {
              email: { '@path': '$.properties.email' }
            },
            contact_traits: {}
          },
          useDefaultMappings: false
        })
      ).rejects.toThrow('No valid profiles found for import')
    })

    it('should succeed with only email provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com',
          first_name: 'Test'
        }
      })

      nock(BASE_URL).put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`).reply(202)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            email: { '@path': '$.properties.email' }
          },
          contact_traits: {
            firstName: { '@path': '$.properties.first_name' }
          }
        },
        useDefaultMappings: false
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
    })

    it('should succeed with only phone provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          phone: '+1-555-0100',
          first_name: 'Test'
        }
      })

      nock(BASE_URL).put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`).reply(202)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            phone: { '@path': '$.properties.phone' }
          },
          contact_traits: {
            firstName: { '@path': '$.properties.first_name' }
          }
        },
        useDefaultMappings: false
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
    })

    it('should succeed with both email and phone provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com',
          phone: '+1-555-0100',
          first_name: 'Test'
        }
      })

      nock(BASE_URL).put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`).reply(202)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            email: { '@path': '$.properties.email' },
            phone: { '@path': '$.properties.phone' }
          },
          contact_traits: {
            firstName: { '@path': '$.properties.first_name' }
          }
        },
        useDefaultMappings: false
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
    })

    it('should include X-Pre-Auth-Context header with twilioAccount', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .matchHeader('X-Pre-Auth-Context', 'AC9876543210')
        .reply(202)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: {
          username: 'test-api-key',
          password: 'test-api-secret',
          twilioAccount: 'AC9876543210'
        },
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
    })

    it('should throw error when bulk upsert fails', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com',
          first_name: 'Test'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .reply(400, { message: 'Invalid request' })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })

    it('should handle special characters in trait values', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com',
          first_name: 'John, Jr.',
          last_name: 'O"Brien'
        }
      })

      let capturedBody: Record<string, unknown> = {}

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`, (body) => {
          capturedBody = body as Record<string, unknown>
          return true
        })
        .reply(202)

      await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      // Validate that special characters are preserved in JSON
      const profile = (capturedBody.profiles as any[])[0]
      expect(profile.traits.Contact.firstName).toBe('John, Jr.')
      expect(profile.traits.Contact.lastName).toBe('O"Brien')
    })

    it('should handle trait names with special characters', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-456',
        properties: {
          email: 'test@example.com',
          special_field: 'value'
        }
      })

      let capturedBody: Record<string, unknown> = {}

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`, (body) => {
          capturedBody = body as Record<string, unknown>
          return true
        })
        .reply(202)

      await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            email: { '@path': '$.properties.email' }
          },
          contact_traits: {
            'first,name': { '@path': '$.properties.special_field' },
            'last"name': { '@path': '$.properties.special_field' }
          }
        },
        useDefaultMappings: true
      })

      // Validate that trait names with special characters are preserved
      const profile = (capturedBody.profiles as any[])[0]
      expect(profile.traits.Contact['first,name']).toBe('value')
      expect(profile.traits.Contact['last"name']).toBe('value')
    })

    it('should prevent contact_traits from overriding identifier values', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-789',
        properties: {
          email: 'correct@example.com',
          phone: '+1-555-1234',
          first_name: 'John'
        }
      })

      let capturedBody: Record<string, unknown> = {}

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`, (body) => {
          capturedBody = body as Record<string, unknown>
          return true
        })
        .reply(202)

      // Mapping that tries to override identifiers in contact_traits
      await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            email: { '@path': '$.properties.email' },
            phone: { '@path': '$.properties.phone' }
          },
          contact_traits: {
            firstName: { '@path': '$.properties.first_name' },
            // Attempting to override identifiers (should be ignored)
            email: { '@literal': 'wrong@example.com' },
            phone: { '@literal': '+1-555-9999' }
          }
        },
        useDefaultMappings: true
      })

      // Verify identifiers remain authoritative
      const profile = (capturedBody.profiles as any[])[0]
      expect(profile.traits.Contact.email).toBe('correct@example.com')
      expect(profile.traits.Contact.phone).toBe('+1-555-1234')
      expect(profile.traits.Contact.firstName).toBe('John')
    })
  })

  describe('performBatch (multiple profiles)', () => {
    it('should upsert multiple profiles in a single bulk request', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          properties: {
            email: 'user1@example.com',
            first_name: 'User',
            last_name: 'One'
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-2',
          properties: {
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
        .reply(202)

      const responses = await testDestination.testBatchAction('upsertProfile', {
        events,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses[0].status).toBe(202)

      // Validate bulk request has 2 profiles
      expect(capturedBody.profiles).toHaveLength(2)
      const profiles = capturedBody.profiles as any[]
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

    it('should filter out invalid profiles and process valid ones', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          properties: {}
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-2',
          properties: {
            email: 'user2@example.com',
            first_name: 'User'
          }
        })
      ]

      let capturedBody: Record<string, unknown> = {}

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`, (body) => {
          capturedBody = body as Record<string, unknown>
          return true
        })
        .reply(202)

      const responses = await testDestination.testBatchAction('upsertProfile', {
        events,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            email: { '@path': '$.properties.email' }
          },
          contact_traits: {
            firstName: { '@path': '$.properties.first_name' }
          }
        },
        useDefaultMappings: false
      })

      expect(responses[0].status).toBe(202)

      // Bulk request should only have 1 valid profile (invalid profile filtered out)
      expect(capturedBody.profiles).toHaveLength(1)
      const profile = (capturedBody.profiles as any[])[0]
      expect(profile.traits.Contact.email).toBe('user2@example.com')
    })

    it('should return MultiStatusResponse with per-payload status', async () => {
      const mockRequestFn = jest.fn().mockResolvedValue({
        status: 202,
        data: {}
      })
      const mockRequest = mockRequestFn as unknown as RequestClient

      const action = Destination.actions.upsertProfile

      const payloads: Payload[] = [
        {
          memora_store: 'test-store-id',
          contact_identifiers: {},
          contact_traits: { firstName: 'Missing identifier' }
        },
        {
          memora_store: 'test-store-id',
          contact_identifiers: { email: 'valid@example.com' },
          contact_traits: { firstName: 'Valid' }
        },
        {
          memora_store: 'test-store-id',
          contact_identifiers: { email: 'another@example.com' },
          contact_traits: {}
        }
      ]

      const executeInput: ExecuteInput<Settings, Payload[]> = {
        payload: payloads,
        settings: defaultSettings
      }

      if (!action.performBatch) {
        throw new Error('performBatch is not defined')
      }

      const result = (await action.performBatch(mockRequest, executeInput)) as any

      // Verify MultiStatusResponse structure
      expect(result.length()).toBe(3)

      // Index 0: invalid (no identifier)
      expect(result.isErrorResponseAtIndex(0)).toBe(true)
      const error0 = result.getResponseAtIndex(0).value()
      expect(error0.status).toBe(400)
      expect(error0.body).toBe('skipped')

      // Index 1: valid
      expect(result.isSuccessResponseAtIndex(1)).toBe(true)
      const success1 = result.getResponseAtIndex(1).value()
      expect(success1.status).toBe(202)
      expect(success1.body).toBe('accepted')

      // Index 2: invalid (no traits)
      expect(result.isErrorResponseAtIndex(2)).toBe(true)
      const error2 = result.getResponseAtIndex(2).value()
      expect(error2.status).toBe(400)
      expect(error2.body).toBe('skipped')

      // Verify only 1 profile was sent in bulk request
      expect(mockRequestFn).toHaveBeenCalledTimes(1)
      const callArgs = mockRequestFn.mock.calls[0]
      expect(callArgs[1].json.profiles).toHaveLength(1)
    })

    it('should throw error when all profiles in batch are invalid and log skipped count', async () => {
      const mockLogger: Logger = {
        level: 'info',
        name: 'test-logger',
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        crit: jest.fn(),
        log: jest.fn(),
        withTags: jest.fn()
      }

      const mockRequest = jest.fn() as unknown as RequestClient
      const action = Destination.actions.upsertProfile

      const payloads: Payload[] = [
        {
          memora_store: 'test-store-id',
          contact_identifiers: {},
          contact_traits: { firstName: undefined }
        },
        {
          memora_store: 'test-store-id',
          contact_identifiers: { email: 'test@example.com' },
          contact_traits: {}
        }
      ]

      const executeInput: ExecuteInput<Settings, Payload[]> = {
        payload: payloads,
        settings: defaultSettings,
        logger: mockLogger
      }

      if (!action.performBatch) {
        throw new Error('performBatch is not defined')
      }

      await expect(action.performBatch(mockRequest, executeInput)).rejects.toThrow('No valid profiles found for import')

      // Verify logger.warn was called with skipped count before error was thrown
      expect(mockLogger.warn).toHaveBeenCalledWith('Skipped 2 invalid profile(s). Processing 0 valid profile(s).')
    })

    it('should handle batch with sparse data correctly', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          properties: {
            email: 'user1@example.com',
            first_name: 'User1'
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-2',
          properties: {
            phone: '+1-555-0200',
            first_name: 'User2'
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-3',
          properties: {
            email: 'user3@example.com',
            phone: '+1-555-0300',
            first_name: 'User'
          }
        })
      ]

      let capturedBody: Record<string, unknown> = {}

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`, (body) => {
          capturedBody = body as Record<string, unknown>
          return true
        })
        .reply(202)

      const responses = await testDestination.testBatchAction('upsertProfile', {
        events,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            email: { '@path': '$.properties.email' },
            phone: { '@path': '$.properties.phone' }
          },
          contact_traits: {
            firstName: { '@path': '$.properties.first_name' }
          }
        },
        useDefaultMappings: false
      })

      expect(responses[0].status).toBe(202)

      // Bulk request should have 3 profiles, each with different field combinations
      expect(capturedBody.profiles).toHaveLength(3)
      const profiles = capturedBody.profiles as any[]

      // First profile has email only
      expect(profiles[0].traits.Contact.email).toBe('user1@example.com')
      expect(profiles[0].traits.Contact.phone).toBeUndefined()

      // Second profile has phone only
      expect(profiles[1].traits.Contact.email).toBeUndefined()
      expect(profiles[1].traits.Contact.phone).toBe('+1-555-0200')

      // Third profile has both
      expect(profiles[2].traits.Contact.email).toBe('user3@example.com')
      expect(profiles[2].traits.Contact.phone).toBe('+1-555-0300')
    })

    it('should throw error when bulk upsert fails for batch', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          properties: {
            email: 'user1@example.com',
            first_name: 'User'
          }
        })
      ]

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .reply(400, { message: 'Invalid profile data' })

      await expect(
        testDestination.testBatchAction('upsertProfile', {
          events,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should throw error when API returns error response', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com',
          first_name: 'Test'
        }
      })

      nock(BASE_URL)
        .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`)
        .reply(400, { message: 'Invalid profile data' })

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

  describe('dynamicFields', () => {
    describe('memora_store', () => {
      it('should fetch and return memory stores from Control Plane', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, {
            stores: ['store-1', 'store-2', 'store-3'],
            meta: {
              pageSize: 100,
              nextToken: 'next-page-token'
            }
          })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-1`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, { id: 'store-1', displayName: 'Store One' })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-2`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, { id: 'store-2', displayName: 'Store Two' })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-3`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, { id: 'store-3', displayName: 'Store Three' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([
          { label: 'Store One', value: 'store-1' },
          { label: 'Store Two', value: 'store-2' },
          { label: 'Store Three', value: 'store-3' }
        ])
      })

      it('should fall back to store id when displayName is empty', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(200, { stores: ['store-no-name'] })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-no-name`)
          .reply(200, { id: 'store-no-name', displayName: '' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([{ label: 'store-no-name', value: 'store-no-name' }])
      })

      it('should include X-Pre-Auth-Context header in store detail requests when twilioAccount is provided', async () => {
        const settingsWithTwilio = {
          username: 'test-api-key',
          password: 'test-api-secret',
          twilioAccount: 'AC9876543210'
        }

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .matchHeader('X-Pre-Auth-Context', 'AC9876543210')
          .reply(200, { stores: ['store-1'] })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-1`)
          .matchHeader('X-Pre-Auth-Context', 'AC9876543210')
          .reply(200, { id: 'store-1', displayName: 'Store One' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: settingsWithTwilio,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([{ label: 'Store One', value: 'store-1' }])
      })

      it('should handle empty stores list', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(200, {
            stores: [],
            meta: { pageSize: 100 }
          })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([])
      })

      it('should return error when a store detail request fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(200, { stores: ['store-1'] })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-1`)
          .reply(500, { message: 'Internal server error' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error).toBeDefined()
        expect(result?.error?.message).toContain('Unable to fetch memora stores')
        expect(result?.error?.code).toBe('FETCH_ERROR')
      })

      it('should return error message when API call fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(500, { message: 'Internal server error' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error).toBeDefined()
        expect(result?.error?.message).toContain('Unable to fetch memora stores')
        expect(result?.error?.message).toContain('Enter the memora store ID manually.')
        expect(result?.error?.code).toBe('FETCH_ERROR')
      })
    })

    describe('contact_traits (dynamic contact traits)', () => {
      it('should fetch and return contact traits from Control Plane', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/test-store-id/TraitGroups/Contact?includeTraits=true&pageSize=100`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, {
            traitGroup: {
              description: '',
              displayName: 'Contact',
              traits: {
                email: {
                  dataType: 'STRING',
                  description: '',
                  displayName: 'email',
                  idTypePromotion: 'email',
                  validationRule: null
                },
                phone: {
                  dataType: 'STRING',
                  description: '',
                  displayName: 'phone',
                  idTypePromotion: 'phone',
                  validationRule: null
                },
                firstName: {
                  dataType: 'STRING',
                  description: '',
                  displayName: 'firstName',
                  idTypePromotion: null,
                  validationRule: null
                },
                lastName: {
                  dataType: 'STRING',
                  description: '',
                  displayName: 'lastName',
                  idTypePromotion: null,
                  validationRule: null
                },
                age: {
                  dataType: 'NUMBER',
                  description: 'User age',
                  displayName: 'age',
                  idTypePromotion: null,
                  validationRule: null
                }
              }
            }
          })

        const result = (await testDestination.testDynamicField('upsertProfile', 'contact_traits.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })) as any

        // Should exclude email and phone since they're identifiers (idTypePromotion = 'email' or 'phone')
        expect(result?.choices).toEqual([
          { label: 'firstName', value: 'firstName', description: 'firstName (STRING)' },
          { label: 'lastName', value: 'lastName', description: 'lastName (STRING)' },
          { label: 'age', value: 'age', description: 'User age' }
        ])
      })

      it('should return error when memora_store is not selected', async () => {
        const result = (await testDestination.testDynamicField('upsertProfile', 'contact_traits.__keys__', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error?.message).toBe('Please select a Memora Store first')
        expect(result?.error?.code).toBe('STORE_REQUIRED')
      })

      it('should return error message when API call fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/test-store-id/TraitGroups/Contact?includeTraits=true&pageSize=100`)
          .reply(500, { message: 'Internal server error' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'contact_traits.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error).toBeDefined()
        expect(result?.error?.message).toContain('Unable to fetch contact traits')
        expect(result?.error?.code).toBe('FETCH_ERROR')
      })
    })
  })
})
