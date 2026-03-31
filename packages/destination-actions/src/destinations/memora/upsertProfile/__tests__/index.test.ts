import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import type { RequestClient, Logger } from '@segment/actions-core'
import Destination from '../../index'
import { API_VERSION } from '../../versioning-info'
import { BASE_URL } from '../../constants'
import type { Payload } from '../generated-types'

const testDestination = createTestIntegration(Destination)

const defaultSettings = {
  username: 'test-api-key',
  password: 'test-api-secret',
  twilioAccount: 'AC1234567890'
}

const defaultMapping = {
  memora_store: 'test-store-id',
  profile_identifiers: {
    'Contact.$.email': { '@path': '$.traits.email' },
    'Contact.$.phone': { '@path': '$.traits.phone' }
  },
  profile_traits: {
    'Contact.$.firstName': { '@path': '$.traits.first_name' },
    'Contact.$.lastName': { '@path': '$.traits.last_name' }
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
        traits: {
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
            profile_identifiers: defaultMapping.profile_identifiers
          },
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })

    it('should throw error when profile has no identifiers', async () => {
      const mockRequest = jest.fn() as unknown as RequestClient
      const action = Destination.actions.upsertProfile

      const payload: Payload = {
        memora_store: 'test-store-id',
        profile_identifiers: {},
        profile_traits: { 'Contact.$.firstName': 'Test' }
      }

      const executeInput = {
        payload,
        settings: defaultSettings
      }

      await expect(action.perform(mockRequest, executeInput as any)).rejects.toThrow(
        'Profile must contain at least one identifier'
      )

      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('should throw error when profile has only one identifier and no traits', async () => {
      const mockRequest = jest.fn() as unknown as RequestClient
      const action = Destination.actions.upsertProfile

      const payload: Payload = {
        memora_store: 'test-store-id',
        profile_identifiers: { 'Contact.$.email': 'test@example.com' },
        profile_traits: {}
      }

      const executeInput = {
        payload,
        settings: defaultSettings
      }

      await expect(action.perform(mockRequest, executeInput)).rejects.toThrow('at least two total fields')

      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('should succeed with two identifiers and no traits', async () => {
      const mockRequest = jest.fn().mockResolvedValue({
        status: 202,
        data: { success: true },
        headers: { 'content-type': 'application/json' },
        content: '{"success":true}'
      }) as unknown as RequestClient
      const action = Destination.actions.upsertProfile

      const payload: Payload = {
        memora_store: 'test-store-id',
        profile_identifiers: {
          'Contact.$.email': 'test@example.com',
          'Contact.$.phone': '+1-555-0100'
        }
      }

      const executeInput = {
        payload,
        settings: defaultSettings
      }

      const result = await action.perform(mockRequest, executeInput)
      expect(result).toHaveProperty('status', 202)
      expect(mockRequest).toHaveBeenCalledTimes(1)
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
          profile_identifiers: {
            'Contact.$.email': { '@path': '$.properties.email' }
          },
          profile_traits: {
            'Contact.$.firstName': { '@path': '$.properties.first_name' }
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
          profile_identifiers: {
            'Contact.$.phone': { '@path': '$.properties.phone' }
          },
          profile_traits: {
            'Contact.$.firstName': { '@path': '$.properties.first_name' }
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
          profile_identifiers: {
            'Contact.$.email': { '@path': '$.properties.email' },
            'Contact.$.phone': { '@path': '$.properties.phone' }
          },
          profile_traits: {
            'Contact.$.firstName': { '@path': '$.properties.first_name' }
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
        traits: {
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
        traits: {
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
        traits: {
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
          profile_identifiers: {
            'Contact.$.email': { '@path': '$.properties.email' }
          },
          profile_traits: {
            'Contact.$.first,name': { '@path': '$.properties.special_field' },
            'Contact.$.last"name': { '@path': '$.properties.special_field' }
          }
        },
        useDefaultMappings: true
      })

      // Validate that trait names with special characters are preserved
      const profile = (capturedBody.profiles as any[])[0]
      expect(profile.traits.Contact['first,name']).toBe('value')
      expect(profile.traits.Contact['last"name']).toBe('value')
    })

    it('should prevent profile_traits from overriding identifier values', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-789',
        traits: {
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

      // Mapping that tries to override identifiers in profile_traits
      await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          profile_identifiers: {
            'Contact.$.email': { '@path': '$.traits.email' },
            'Contact.$.phone': { '@path': '$.traits.phone' }
          },
          profile_traits: {
            'Contact.$.firstName': { '@path': '$.traits.first_name' },
            // Attempting to override identifiers (will be overridden by profile_identifiers which are authoritative)
            'Contact.$.email': { '@literal': 'wrong@example.com' },
            'Contact.$.phone': { '@literal': '+1-555-9999' }
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

    it('should support other trait groups with traitGroupName.$.traitName format', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-890',
        traits: {
          email: 'test@example.com',
          first_name: 'Alice',
          last_purchase: '2024-01-15',
          favorite_category: 'Electronics'
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
          profile_identifiers: {
            'Contact.$.email': { '@path': '$.traits.email' }
          },
          profile_traits: {
            'Contact.$.firstName': { '@path': '$.traits.first_name' },
            'PurchaseHistory.$.lastPurchaseDate': { '@path': '$.traits.last_purchase' },
            'PurchaseHistory.$.favoriteCategory': { '@path': '$.traits.favorite_category' }
          }
        },
        useDefaultMappings: true
      })

      const profile = (capturedBody.profiles as any[])[0]
      // Contact traits
      expect(profile.traits.Contact.email).toBe('test@example.com')
      expect(profile.traits.Contact.firstName).toBe('Alice')
      // PurchaseHistory trait group
      expect(profile.traits.PurchaseHistory).toBeDefined()
      expect(profile.traits.PurchaseHistory.lastPurchaseDate).toBe('2024-01-15')
      expect(profile.traits.PurchaseHistory.favoriteCategory).toBe('Electronics')
    })

    it('should handle multiple trait groups in the same profile', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-891',
        traits: {
          email: 'multi@example.com',
          first_name: 'Bob',
          last_purchase: '2024-02-20',
          loyalty_tier: 'Gold',
          last_login: '2024-03-01'
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
          profile_identifiers: {
            'Contact.$.email': { '@path': '$.traits.email' }
          },
          profile_traits: {
            'Contact.$.firstName': { '@path': '$.traits.first_name' },
            'PurchaseHistory.$.lastPurchaseDate': { '@path': '$.traits.last_purchase' },
            'Loyalty.$.tier': { '@path': '$.traits.loyalty_tier' },
            'Engagement.$.lastLogin': { '@path': '$.traits.last_login' }
          }
        },
        useDefaultMappings: true
      })

      const profile = (capturedBody.profiles as any[])[0]
      // Verify all trait groups are present
      expect(profile.traits.Contact.email).toBe('multi@example.com')
      expect(profile.traits.Contact.firstName).toBe('Bob')
      expect(profile.traits.PurchaseHistory.lastPurchaseDate).toBe('2024-02-20')
      expect(profile.traits.Loyalty.tier).toBe('Gold')
      expect(profile.traits.Engagement.lastLogin).toBe('2024-03-01')
    })

    it('should create Contact trait group when only non-Contact traits are provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-892',
        traits: {
          email: 'nocontact@example.com',
          phone: '+1-555-9999',
          last_purchase: '2024-03-15',
          favorite_category: 'Books'
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
          profile_identifiers: {
            'Contact.$.email': { '@path': '$.traits.email' },
            'Contact.$.phone': { '@path': '$.traits.phone' }
          },
          profile_traits: {
            // Only non-Contact traits - no Contact.$.* fields
            'PurchaseHistory.$.lastPurchaseDate': { '@path': '$.traits.last_purchase' },
            'PurchaseHistory.$.favoriteCategory': { '@path': '$.traits.favorite_category' }
          }
        },
        useDefaultMappings: true
      })

      const profile = (capturedBody.profiles as any[])[0]
      // Verify Contact trait group was created for identifiers
      expect(profile.traits.Contact).toBeDefined()
      expect(profile.traits.Contact.email).toBe('nocontact@example.com')
      expect(profile.traits.Contact.phone).toBe('+1-555-9999')
      // Verify PurchaseHistory trait group
      expect(profile.traits.PurchaseHistory).toBeDefined()
      expect(profile.traits.PurchaseHistory.lastPurchaseDate).toBe('2024-03-15')
      expect(profile.traits.PurchaseHistory.favoriteCategory).toBe('Books')
    })

    it('should throw error for invalid trait key formats in single profile', async () => {
      const mockRequest = jest.fn() as unknown as RequestClient
      const action = Destination.actions.upsertProfile

      const payload: Payload = {
        memora_store: 'test-store-id',
        profile_identifiers: { 'Contact.$.email': 'invalid@example.com' },
        profile_traits: {
          'Contact.firstName': 'InvalidFormat1', // Missing ".$."
          ContactlastName: 'InvalidFormat2' // Missing separators
        }
      }

      const executeInput = {
        payload,
        settings: defaultSettings
      }

      if (!action.perform) {
        throw new Error('perform is not defined')
      }

      await expect(action.perform(mockRequest, executeInput as any)).rejects.toThrow(
        'Invalid trait key format detected'
      )

      // Verify no API call was made
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('should throw error for invalid identifier key formats in single profile', async () => {
      const mockRequest = jest.fn() as unknown as RequestClient
      const action = Destination.actions.upsertProfile

      const payload: Payload = {
        memora_store: 'test-store-id',
        profile_identifiers: {
          email: 'test@example.com', // Missing "TraitGroupName.$."
          'Contact.phone': '+1-555-0100' // Missing ".$."
        },
        profile_traits: { 'Contact.$.firstName': 'Test' }
      }

      const executeInput = {
        payload,
        settings: defaultSettings
      }

      if (!action.perform) {
        throw new Error('perform is not defined')
      }

      await expect(action.perform(mockRequest, executeInput)).rejects.toThrow('Invalid identifier key format detected')

      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('should return raw ModifiedResponse when perform succeeds', async () => {
      const mockRequest = jest.fn().mockResolvedValue({
        status: 202,
        data: { success: true },
        headers: { 'content-type': 'application/json' },
        content: '{"success":true}'
      }) as unknown as RequestClient
      const action = Destination.actions.upsertProfile

      const payload: Payload = {
        memora_store: 'test-store-id',
        profile_identifiers: { 'Contact.$.email': 'success@example.com' },
        profile_traits: { 'Contact.$.firstName': 'John' }
      }

      const executeInput = {
        payload,
        settings: defaultSettings
      }

      if (!action.perform) {
        throw new Error('perform is not defined')
      }

      const result = await action.perform(mockRequest, executeInput)

      // Should return raw ModifiedResponse (not MultiStatusResponse)
      expect(result).toHaveProperty('status', 202)
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('headers')
      expect(result).toHaveProperty('content')

      // Should NOT have MultiStatusResponse methods
      expect(result).not.toHaveProperty('length')
      expect(result).not.toHaveProperty('getResponseAtIndex')

      // Verify API call was made
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('performBatch (multiple profiles)', () => {
    it('should upsert multiple profiles in a single bulk request', async () => {
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
      const mockRequest = jest.fn() as unknown as RequestClient
      const action = Destination.actions.upsertProfile

      if (!action.performBatch) {
        throw new Error('performBatch is not defined')
      }

      const executeInput = {
        payload: [],
        settings: defaultSettings
      }

      // Call performBatch directly with empty payloads array
      await expect(action.performBatch(mockRequest, executeInput as any)).rejects.toThrow('No profiles provided')
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
          profile_identifiers: {
            'Contact.$.email': { '@path': '$.properties.email' }
          },
          profile_traits: {
            'Contact.$.firstName': { '@path': '$.properties.first_name' }
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
          profile_identifiers: {},
          profile_traits: { 'Contact.$.firstName': 'Missing identifier' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'valid@example.com' },
          profile_traits: { 'Contact.$.firstName': 'Valid' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'another@example.com' }
        }
      ]

      const executeInput = {
        payload: payloads,
        settings: defaultSettings
      }

      if (!action.performBatch) {
        throw new Error('performBatch is not defined')
      }

      const result = (await action.performBatch(mockRequest, executeInput as any)) as any

      // Verify MultiStatusResponse structure
      expect(result.length()).toBe(3)

      // Index 0: invalid (no identifier)
      expect(result.isErrorResponseAtIndex(0)).toBe(true)
      const error0 = result.getResponseAtIndex(0).value()
      expect(error0.status).toBe(400)

      // Index 1: valid
      expect(result.isSuccessResponseAtIndex(1)).toBe(true)
      const success1 = result.getResponseAtIndex(1).value()
      expect(success1.status).toBe(202)
      expect(success1.body).toBe('accepted')

      // Index 2: invalid (only 1 identifier, no traits - needs at least 2 total fields)
      expect(result.isErrorResponseAtIndex(2)).toBe(true)
      const error2 = result.getResponseAtIndex(2).value()
      expect(error2.status).toBe(400)

      // Verify only 1 profile was sent in bulk request
      expect(mockRequestFn).toHaveBeenCalledTimes(1)
      const callArgs = mockRequestFn.mock.calls[0]
      expect(callArgs[1].json.profiles).toHaveLength(1)
    })

    it('should return MultiStatusResponse when all profiles in batch are invalid', async () => {
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
          // Invalid: no identifiers
          memora_store: 'test-store-id',
          profile_identifiers: {},
          profile_traits: { 'Contact.$.firstName': undefined }
        },
        {
          // Invalid: only 1 identifier, no traits (needs at least 2 total fields)
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'test@example.com' }
        },
        {
          // Invalid: bad trait key format
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'another@example.com' },
          profile_traits: {
            'Contact.firstName': 'InvalidFormat' // Missing ".$."
          }
        }
      ]

      const executeInput = {
        payload: payloads,
        settings: defaultSettings,
        logger: mockLogger
      }

      if (!action.performBatch) {
        throw new Error('performBatch is not defined')
      }

      const result = (await action.performBatch(mockRequest, executeInput as any)) as any

      // Verify MultiStatusResponse structure - all profiles should have error status
      expect(result.length()).toBe(3)
      expect(result.isErrorResponseAtIndex(0)).toBe(true)
      expect(result.isErrorResponseAtIndex(1)).toBe(true)
      expect(result.isErrorResponseAtIndex(2)).toBe(true)

      // Verify error messages
      const error0 = result.getResponseAtIndex(0).value()
      expect(error0.status).toBe(400)
      expect(error0.errormessage).toContain('Profile must contain at least one identifier')

      const error1 = result.getResponseAtIndex(1).value()
      expect(error1.status).toBe(400)
      expect(error1.errormessage).toContain('at least two total fields')

      const error2 = result.getResponseAtIndex(2).value()
      expect(error2.status).toBe(400)
      expect(error2.errormessage).toContain('Invalid trait key format detected')
      expect(error2.errormessage).toContain('Contact.firstName')

      // Verify logger.warn was called
      expect(mockLogger.warn).toHaveBeenCalledWith('Skipped 3 invalid profile(s). Processing 0 valid profile(s).')
      expect(mockLogger.warn).toHaveBeenCalledWith('No valid profiles to import. All profiles failed validation.')

      // Verify no API call was made
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('should return MultiStatusResponse when performBatch called with single invalid payload', async () => {
      const mockRequest = jest.fn() as unknown as RequestClient
      const action = Destination.actions.upsertProfile

      // Single invalid payload in a batch
      const payloads: Payload[] = [
        {
          memora_store: 'test-store-id',
          profile_identifiers: {}
        }
      ]

      const executeInput = {
        payload: payloads,
        settings: defaultSettings
      }

      if (!action.performBatch) {
        throw new Error('performBatch is not defined')
      }

      const result = (await action.performBatch(mockRequest, executeInput)) as any

      // Should return MultiStatusResponse (not throw), even with single payload
      expect(result.length()).toBe(1)
      expect(result.isErrorResponseAtIndex(0)).toBe(true)
      const error = result.getResponseAtIndex(0).value()
      expect(error.status).toBe(400)
      expect(error.errormessage).toContain('Profile must contain at least one identifier')

      // Verify no API call was made
      expect(mockRequest).not.toHaveBeenCalled()
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
          profile_identifiers: {
            'Contact.$.email': { '@path': '$.properties.email' },
            'Contact.$.phone': { '@path': '$.properties.phone' }
          },
          profile_traits: {
            'Contact.$.firstName': { '@path': '$.properties.first_name' }
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
          traits: {
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

    it('should handle invalid trait key formats in batch using MultiStatusResponse', async () => {
      const mockRequestFn = jest.fn().mockResolvedValue({
        status: 202,
        data: {}
      })
      const mockRequest = mockRequestFn as unknown as RequestClient

      const action = Destination.actions.upsertProfile

      const payloads: Payload[] = [
        {
          // Valid profile
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'valid@example.com' },
          profile_traits: { 'Contact.$.firstName': 'Valid' }
        },
        {
          // Invalid profile - bad trait key format
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'invalid@example.com' },
          profile_traits: {
            'Contact.firstName': 'Missing$', // Invalid: missing ".$."
            badKey: 'value' // Invalid: wrong format
          }
        },
        {
          // Valid profile
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.phone': '+1-555-1234' },
          profile_traits: { 'PurchaseHistory.$.lastPurchase': '2024-01-01' }
        }
      ]

      const executeInput = {
        payload: payloads,
        settings: defaultSettings
      }

      if (!action.performBatch) {
        throw new Error('performBatch is not defined')
      }

      const result = (await action.performBatch(mockRequest, executeInput as any)) as any

      // Verify MultiStatusResponse structure
      expect(result.length()).toBe(3)

      // Index 0: valid profile - should succeed
      expect(result.isSuccessResponseAtIndex(0)).toBe(true)

      // Index 1: invalid profile - should fail with validation error
      expect(result.isErrorResponseAtIndex(1)).toBe(true)
      const error1 = result.getResponseAtIndex(1).value()
      expect(error1.status).toBe(400)
      expect(error1.errormessage).toContain('Invalid trait key format detected')
      expect(error1.errormessage).toContain('Contact.firstName')
      expect(error1.errormessage).toContain('badKey')

      // Index 2: valid profile - should succeed
      expect(result.isSuccessResponseAtIndex(2)).toBe(true)

      // Verify only valid profiles were sent to API
      expect(mockRequestFn).toHaveBeenCalledTimes(1)
      const requestBody = mockRequestFn.mock.calls[0][1].json
      expect(requestBody.profiles).toHaveLength(2) // Only 2 valid profiles
    })
  })

  describe('error handling', () => {
    it('should throw error when API returns error response', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
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
        expect(result?.error?.message).toContain('Please check your authentication credentials.')
        expect(result?.error?.code).toBe('FETCH_ERROR')
      })
    })

    describe('profile_identifiers (dynamic identifiers from all trait groups)', () => {
      it('should fetch and return identifier traits from all trait groups', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/test-store-id/TraitGroups?pageSize=100&includeTraits=true`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, {
            traitGroups: [
              {
                displayName: 'Contact',
                description: '',
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
                  }
                },
                version: 1
              },
              {
                displayName: 'Loyalty',
                description: 'Loyalty traits',
                traits: {
                  memberId: {
                    dataType: 'STRING',
                    description: 'Loyalty member ID',
                    displayName: 'Member ID',
                    idTypePromotion: 'loyalty_id',
                    validationRule: null
                  },
                  tier: {
                    dataType: 'STRING',
                    description: 'Loyalty tier',
                    displayName: 'Tier',
                    idTypePromotion: null,
                    validationRule: null
                  }
                },
                version: 1
              }
            ]
          })

        const result = (await testDestination.testDynamicField('upsertProfile', 'profile_identifiers.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })) as any

        // Should return only traits with idTypePromotion set
        expect(result?.choices).toEqual([
          { label: 'Contact.email', value: 'Contact.$.email', description: 'Contact - email (email)' },
          { label: 'Contact.phone', value: 'Contact.$.phone', description: 'Contact - phone (phone)' },
          { label: 'Loyalty.Member ID', value: 'Loyalty.$.memberId', description: 'Loyalty member ID' }
        ])
      })

      it('should return error when memora_store is not selected', async () => {
        const result = (await testDestination.testDynamicField('upsertProfile', 'profile_identifiers.__keys__', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error?.message).toBe('Please select a Memora Store first')
        expect(result?.error?.code).toBe('STORE_REQUIRED')
      })

      it('should return error message when API call fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/test-store-id/TraitGroups?pageSize=100&includeTraits=true`)
          .reply(500, { message: 'Internal server error' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'profile_identifiers.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error).toBeDefined()
        expect(result?.error?.message).toContain('Unable to fetch identifiers')
        expect(result?.error?.code).toBe('FETCH_ERROR')
      })
    })

    describe('profile_traits (dynamic traits from all trait groups)', () => {
      it('should fetch and return traits from all trait groups', async () => {
        // Mock listing trait groups (includes traits in response)
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/test-store-id/TraitGroups?pageSize=100&includeTraits=true`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, {
            traitGroups: [
              {
                displayName: 'Contact',
                description: '',
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
                },
                version: 1
              },
              {
                displayName: 'PurchaseHistory',
                description: 'Purchase history traits',
                traits: {
                  lastPurchaseDate: {
                    dataType: 'STRING',
                    description: 'Date of last purchase',
                    displayName: 'Last Purchase Date',
                    idTypePromotion: null,
                    validationRule: null
                  },
                  totalSpent: {
                    dataType: 'NUMBER',
                    description: 'Total amount spent',
                    displayName: 'Total Spent',
                    idTypePromotion: null,
                    validationRule: null
                  },
                  favoriteCategory: {
                    dataType: 'STRING',
                    description: 'Favorite product category',
                    displayName: 'Favorite Category',
                    idTypePromotion: null,
                    validationRule: null
                  }
                },
                version: 1
              }
            ]
          })

        const result = (await testDestination.testDynamicField('upsertProfile', 'profile_traits.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })) as any

        // Should exclude identifiers (traits with idTypePromotion) and non-STRING traits
        // All trait groups use traitGroupName.$.traitName format
        expect(result?.choices).toEqual([
          { label: 'Contact.firstName', value: 'Contact.$.firstName', description: 'Contact - firstName (STRING)' },
          { label: 'Contact.lastName', value: 'Contact.$.lastName', description: 'Contact - lastName (STRING)' },
          {
            label: 'PurchaseHistory.Last Purchase Date',
            value: 'PurchaseHistory.$.lastPurchaseDate',
            description: 'Date of last purchase'
          },
          {
            label: 'PurchaseHistory.Favorite Category',
            value: 'PurchaseHistory.$.favoriteCategory',
            description: 'Favorite product category'
          }
        ])
      })

      it('should return error when memora_store is not selected', async () => {
        const result = (await testDestination.testDynamicField('upsertProfile', 'profile_traits.__keys__', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error?.message).toBe('Please select a Memora Store first')
        expect(result?.error?.code).toBe('STORE_REQUIRED')
      })

      it('should return error message when API call fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/test-store-id/TraitGroups?pageSize=100&includeTraits=true`)
          .reply(500, { message: 'Internal server error' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'profile_traits.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error).toBeDefined()
        expect(result?.error?.message).toContain('Unable to fetch traits')
        expect(result?.error?.code).toBe('FETCH_ERROR')
      })
    })
  })
})
