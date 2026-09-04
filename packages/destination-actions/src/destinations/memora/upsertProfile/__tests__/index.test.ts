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

      await expect(action.perform(mockRequest, executeInput)).rejects.toThrow(
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

    it('should handle multiple trait groups in the same profile including non-STRING trait types', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-891',
        traits: {
          email: 'multi@example.com',
          first_name: 'Bob',
          last_purchase: '2024-02-20',
          loyalty_tier: 'Gold',
          last_login: '2024-03-01',
          total_orders: 42,
          is_subscribed: true
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
            'PurchaseHistory.$.totalOrders': { '@path': '$.traits.total_orders' },
            'Loyalty.$.tier': { '@path': '$.traits.loyalty_tier' },
            'Loyalty.$.isSubscribed': { '@path': '$.traits.is_subscribed' },
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
      // Non-STRING trait values must be passed through as their native types (not coerced to strings)
      expect(profile.traits.PurchaseHistory.totalOrders).toBe(42)
      expect(profile.traits.Loyalty.tier).toBe('Gold')
      expect(profile.traits.Loyalty.isSubscribed).toBe(true)
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

    it('should route non-Contact identifiers to correct trait groups', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-loyalty',
        traits: {
          loyalty_id: 'LOYAL123',
          member_tier: 'Gold',
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

      await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          profile_identifiers: {
            'Loyalty.$.memberId': { '@path': '$.traits.loyalty_id' }
          },
          profile_traits: {
            'Contact.$.firstName': { '@path': '$.traits.first_name' },
            'Loyalty.$.tier': { '@path': '$.traits.member_tier' }
          }
        },
        useDefaultMappings: false
      })

      const profile = (capturedBody.profiles as any[])[0]
      // Verify non-Contact identifier is routed to Loyalty trait group
      expect(profile.traits.Loyalty).toBeDefined()
      expect(profile.traits.Loyalty.memberId).toBe('LOYAL123')
      expect(profile.traits.Loyalty.tier).toBe('Gold')
      // Verify Contact trait is also present
      expect(profile.traits.Contact).toBeDefined()
      expect(profile.traits.Contact.firstName).toBe('Jane')
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

      await expect(action.perform(mockRequest, executeInput)).rejects.toThrow('Invalid trait key format detected')

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
      await expect(action.performBatch(mockRequest, executeInput)).rejects.toThrow('No profiles provided')
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

      const result = (await action.performBatch(mockRequest, executeInput)) as any

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

      const result = (await action.performBatch(mockRequest, executeInput)) as any

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

      // Verify logger.warn was called (messages include tags)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipped 3 invalid profile(s). Processing 0 valid profile(s).')
      )
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No valid profiles to import. All profiles failed validation.')
      )

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

      const result = (await action.performBatch(mockRequest, executeInput)) as any

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

    it('should handle invalid identifier key formats in batch using MultiStatusResponse', async () => {
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
          // Invalid profile - bad identifier key format (bare key without TraitGroup.$.)
          memora_store: 'test-store-id',
          profile_identifiers: {
            email: 'invalid@example.com', // Invalid: missing "Contact.$."
            'Contact.phone': '+1-555-0100' // Invalid: missing ".$."
          },
          profile_traits: { 'Contact.$.firstName': 'Invalid' }
        },
        {
          // Valid profile
          memora_store: 'test-store-id',
          profile_identifiers: { 'Loyalty.$.memberId': 'LOYAL456' },
          profile_traits: { 'Loyalty.$.tier': 'Silver' }
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

      // Verify MultiStatusResponse structure
      expect(result.length()).toBe(3)

      // Index 0: valid profile - should succeed
      expect(result.isSuccessResponseAtIndex(0)).toBe(true)

      // Index 1: invalid profile - should fail with validation error
      expect(result.isErrorResponseAtIndex(1)).toBe(true)
      const error1 = result.getResponseAtIndex(1).value()
      expect(error1.status).toBe(400)
      expect(error1.errormessage).toContain('Invalid identifier key format detected')
      expect(error1.errormessage).toContain('email')
      expect(error1.errormessage).toContain('Contact.phone')

      // Index 2: valid profile - should succeed
      expect(result.isSuccessResponseAtIndex(2)).toBe(true)

      // Verify only valid profiles were sent to API
      expect(mockRequestFn).toHaveBeenCalledTimes(1)
      const requestBody = mockRequestFn.mock.calls[0][1].json
      expect(requestBody.profiles).toHaveLength(2) // Only 2 valid profiles
    })
  })

  describe('stats and logging', () => {
    const mockStatsClient = {
      observe: jest.fn(),
      _name: jest.fn(),
      _tags: jest.fn(),
      incr: jest.fn(),
      set: jest.fn(),
      histogram: jest.fn()
    }
    const mockStatsContext = { statsClient: mockStatsClient, tags: ['env:test'] }

    beforeEach(() => {
      jest.clearAllMocks()
      nock.cleanAll()
    })

    it('should emit success stat with correct count and tags on success', async () => {
      const action = Destination.actions.upsertProfile
      const payloads: Payload[] = [
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.firstName': 'A' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'b@example.com' },
          profile_traits: { 'Contact.$.firstName': 'B' }
        }
      ]

      const mockRequestFn = jest.fn().mockResolvedValue({ status: 202, data: {}, headers: { get: () => 'req-id-123' } })
      await action.performBatch!(mockRequestFn as unknown as RequestClient, {
        payload: payloads,
        settings: defaultSettings,
        statsContext: mockStatsContext
      })

      const tags = mockStatsClient.incr.mock.calls.find(
        (c: any[]) => c[0] === 'memora.upsert_profile.success'
      )?.[2] as string[]
      expect(tags).toEqual(
        expect.arrayContaining([
          'env:test',
          `twilioAccountId:${defaultSettings.twilioAccount}`,
          'memory_store_id:test-store-id'
        ])
      )
      expect(tags).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/^audience_key:/), expect.stringMatching(/^space_id:/)])
      )
      expect(mockStatsClient.incr).toHaveBeenCalledWith('memora.upsert_profile.success', 2, expect.anything())
      expect(mockStatsClient.incr).not.toHaveBeenCalledWith(
        'memora.upsert_profile.failure',
        expect.anything(),
        expect.anything()
      )
    })

    it('should emit failure stat for invalid profiles alongside success for valid ones', async () => {
      const mockRequestFn = jest.fn().mockResolvedValue({ status: 202, data: {}, headers: { get: () => null } })
      const action = Destination.actions.upsertProfile

      const payloads: Payload[] = [
        { memora_store: 'test-store-id', profile_identifiers: {}, profile_traits: { 'Contact.$.firstName': 'Bad' } },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'good@example.com' },
          profile_traits: { 'Contact.$.firstName': 'Good' }
        }
      ]

      await action.performBatch!(mockRequestFn as unknown as RequestClient, {
        payload: payloads,
        settings: defaultSettings,
        statsContext: mockStatsContext
      })

      expect(mockStatsClient.incr).toHaveBeenCalledWith(
        'memora.upsert_profile.success',
        1,
        expect.arrayContaining(['twilioAccountId:AC1234567890'])
      )
      expect(mockStatsClient.incr).toHaveBeenCalledWith(
        'memora.upsert_profile.failure',
        1,
        expect.arrayContaining(['twilioAccountId:AC1234567890'])
      )
    })

    it('should emit failure stat with full payload count when API call throws', async () => {
      const mockRequestFn = jest
        .fn()
        .mockRejectedValue(Object.assign(new Error('server error'), { response: { status: 500 } }))
      const action = Destination.actions.upsertProfile

      const payloads: Payload[] = [
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.firstName': 'A' }
        }
      ]

      await expect(
        action.performBatch!(mockRequestFn as unknown as RequestClient, {
          payload: payloads,
          settings: defaultSettings,
          statsContext: mockStatsContext
        })
      ).rejects.toThrow('server error')

      expect(mockStatsClient.incr).toHaveBeenCalledWith(
        'memora.upsert_profile.failure',
        1,
        expect.arrayContaining(['twilioAccountId:AC1234567890'])
      )
    })

    it('should use computation_key and space_id from personasContext as tags', async () => {
      const mockRequestFn = jest.fn().mockResolvedValue({ status: 202, data: {}, headers: { get: () => null } })
      const action = Destination.actions.upsertProfile

      const payloads: Payload[] = [
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.firstName': 'A' }
        }
      ]

      await action.performBatch!(mockRequestFn as unknown as RequestClient, {
        payload: payloads,
        settings: defaultSettings,
        statsContext: mockStatsContext,
        personasContext: {
          computation_key: 'my-audience',
          computation_id: 'comp-1',
          namespace: 'ns',
          space_id: 'space-abc'
        }
      })

      expect(mockStatsClient.incr).toHaveBeenCalledWith(
        'memora.upsert_profile.success',
        1,
        expect.arrayContaining(['audience_key:my-audience', 'space_id:space-abc'])
      )
    })

    it('should omit audience_key and space_id tags when personasContext is undefined', async () => {
      const mockRequestFn = jest.fn().mockResolvedValue({ status: 202, data: {}, headers: { get: () => null } })
      const action = Destination.actions.upsertProfile

      const payloads: Payload[] = [
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.firstName': 'A' }
        }
      ]

      await action.performBatch!(mockRequestFn as unknown as RequestClient, {
        payload: payloads,
        settings: defaultSettings,
        statsContext: mockStatsContext
      })

      const tags = mockStatsClient.incr.mock.calls.find(
        (c: any[]) => c[0] === 'memora.upsert_profile.success'
      )?.[2] as string[]
      expect(tags.some((t: string) => t.startsWith('audience_key:'))).toBe(false)
      expect(tags.some((t: string) => t.startsWith('space_id:'))).toBe(false)
    })

    it('should emit failure stat when all profiles fail validation without making an API call', async () => {
      const mockRequestFn = jest.fn()
      const action = Destination.actions.upsertProfile

      const payloads: Payload[] = [
        { memora_store: 'test-store-id', profile_identifiers: {}, profile_traits: { 'Contact.$.firstName': 'Bad' } },
        { memora_store: 'test-store-id', profile_identifiers: { 'Contact.$.email': 'sparse@example.com' } }
      ]

      await action.performBatch!(mockRequestFn as unknown as RequestClient, {
        payload: payloads,
        settings: defaultSettings,
        statsContext: mockStatsContext,
        personasContext: { computation_key: 'my-audience', computation_id: 'comp-1', namespace: 'ns', space_id: 'sp-1' }
      })

      expect(mockRequestFn).not.toHaveBeenCalled()
      expect(mockStatsClient.incr).toHaveBeenCalledWith(
        'memora.upsert_profile.failure',
        2,
        expect.arrayContaining([
          'env:test',
          `twilioAccountId:${defaultSettings.twilioAccount}`,
          'memory_store_id:test-store-id',
          'audience_key:my-audience',
          'space_id:sp-1'
        ])
      )
      expect(mockStatsClient.incr).not.toHaveBeenCalledWith(
        'memora.upsert_profile.success',
        expect.anything(),
        expect.anything()
      )
    })
  })

  describe('identifier overlap stats', () => {
    const mockStatsClient = {
      observe: jest.fn(),
      _name: jest.fn(),
      _tags: jest.fn(),
      incr: jest.fn(),
      set: jest.fn(),
      histogram: jest.fn()
    }
    const mockStatsContext = { statsClient: mockStatsClient, tags: ['env:test'] }
    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      crit: jest.fn(),
      log: jest.fn(),
      level: ''
    }

    const histogramCall = (name: string) =>
      mockStatsClient.histogram.mock.calls.find((c: any[]) => c[0] === `memora.upsert_profile.${name}`)
    const histogramValue = (name: string) => histogramCall(name)?.[1]

    const profile = (identifiers: Record<string, unknown>): Payload => ({
      memora_store: 'test-store-id',
      profile_identifiers: identifiers,
      profile_traits: { 'Contact.$.firstName': 'X' }
    })

    const runBatch = async (payloads: Payload[], statsContext: unknown = mockStatsContext) => {
      const mockRequestFn = jest.fn().mockResolvedValue({ status: 202, data: {}, headers: { get: () => null } })
      await Destination.actions.upsertProfile.performBatch!(mockRequestFn as unknown as RequestClient, {
        payload: payloads,
        settings: defaultSettings,
        statsContext: statsContext as never,
        logger: mockLogger as any
      })
      return mockRequestFn
    }

    beforeEach(() => {
      jest.clearAllMocks()
      nock.cleanAll()
    })

    it('should report no overlap when every profile has unique identifiers', async () => {
      await runBatch([
        profile({ 'Contact.$.email': 'a@example.com' }),
        profile({ 'Contact.$.email': 'b@example.com' }),
        profile({ 'Contact.$.email': 'c@example.com' })
      ])

      expect(histogramValue('batch_overlapping_events')).toBe(0)
      expect(histogramValue('batch_largest_group')).toBe(1)
      expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Overlapping identifiers'))

      // These are the only two overlap metrics emitted
      expect(mockStatsClient.histogram.mock.calls.map((c: any[]) => c[0])).toEqual([
        'memora.upsert_profile.batch_overlapping_events',
        'memora.upsert_profile.batch_largest_group'
      ])
    })

    it('should collapse repeated identifier pairs into one distinct profile', async () => {
      // 3 events all carrying email1 + phone1 -> a single distinct pair
      const identifiers = { 'Contact.$.email': 'email1@example.com', 'Contact.$.phone': '+15550001' }
      await runBatch([profile(identifiers), profile(identifiers), profile(identifiers)])

      expect(histogramValue('batch_overlapping_events')).toBe(3)
      expect(histogramValue('batch_largest_group')).toBe(3)
      expect(histogramCall('batch_overlapping_events')?.[2]).toEqual(expect.arrayContaining(['env:test']))
    })

    it('should link profiles transitively through a shared identifier value', async () => {
      // {email1, phone1} x3 plus {email1} and {phone1} -> still one profile upstream
      const pair = { 'Contact.$.email': 'email1@example.com', 'Contact.$.phone': '+15550001' }
      await runBatch([
        profile(pair),
        profile(pair),
        profile(pair),
        profile({ 'Contact.$.email': 'email1@example.com' }),
        profile({ 'Contact.$.phone': '+15550001' })
      ])

      expect(histogramValue('batch_overlapping_events')).toBe(5)
      expect(histogramValue('batch_largest_group')).toBe(5)
    })

    it('should count overlapping and unique profiles separately in a mixed batch', async () => {
      await runBatch([
        profile({ 'Contact.$.email': 'dupe@example.com' }),
        profile({ 'Contact.$.email': 'dupe@example.com' }),
        profile({ 'Contact.$.email': 'unique1@example.com' }),
        profile({ 'Contact.$.email': 'unique2@example.com' })
      ])

      expect(histogramValue('batch_overlapping_events')).toBe(2)
      expect(histogramValue('batch_largest_group')).toBe(2)
    })

    it('should sum overlapping events across multiple distinct groups', async () => {
      // Two groups of two, plus a singleton: overlapping = 4, largest group = 2
      await runBatch([
        profile({ 'Contact.$.email': 'a@example.com' }),
        profile({ 'Contact.$.email': 'solo@example.com' }),
        profile({ 'Contact.$.email': 'b@example.com' }),
        profile({ 'Contact.$.email': 'a@example.com' }),
        profile({ 'Contact.$.email': 'b@example.com' })
      ])

      expect(histogramValue('batch_overlapping_events')).toBe(4)
      expect(histogramValue('batch_largest_group')).toBe(2)
    })

    it('should not treat the same value under different identifier keys as an overlap', async () => {
      await runBatch([
        profile({ 'Contact.$.email': 'shared-value' }),
        profile({ 'Contact.$.externalId': 'shared-value' })
      ])

      expect(histogramValue('batch_overlapping_events')).toBe(0)
      expect(histogramValue('batch_largest_group')).toBe(1)
    })

    it('should match identifier values that differ only by surrounding whitespace', async () => {
      await runBatch([
        profile({ 'Contact.$.email': 'dupe@example.com' }),
        profile({ 'Contact.$.email': '  dupe@example.com  ' })
      ])

      expect(histogramValue('batch_overlapping_events')).toBe(2)
      expect(histogramValue('batch_largest_group')).toBe(2)
    })

    it('should ignore blank identifier values when grouping', async () => {
      await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com', 'Contact.$.phone': '   ' },
          profile_traits: { 'Contact.$.firstName': 'A' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'b@example.com', 'Contact.$.phone': '' },
          profile_traits: { 'Contact.$.firstName': 'B' }
        }
      ])

      expect(histogramValue('batch_overlapping_events')).toBe(0)
      expect(histogramValue('batch_largest_group')).toBe(1)
    })

    it('should exclude profiles that failed validation from the overlap counts', async () => {
      await runBatch([
        profile({ 'Contact.$.email': 'valid@example.com' }),
        { memora_store: 'test-store-id', profile_identifiers: {}, profile_traits: { 'Contact.$.firstName': 'Bad' } }
      ])

      expect(histogramValue('batch_overlapping_events')).toBe(0)
      expect(histogramValue('batch_largest_group')).toBe(1)
    })

    it('should log a warning with counts but never the identifier values', async () => {
      await runBatch([
        profile({ 'Contact.$.email': 'secret@example.com' }),
        profile({ 'Contact.$.email': 'secret@example.com' })
      ])

      const warning = mockLogger.warn.mock.calls
        .map((c: any[]) => String(c[0]))
        .find((m: string) => m.includes('Overlapping identifiers'))
      expect(warning).toBeDefined()
      expect(warning).toContain('2 profile(s) resolve to 1 distinct profile(s)')
      expect(warning).toContain('largest group is 2')
      expect(warning).not.toContain('secret@example.com')
    })

    // Regression: an identifier value of `{ toString: null }` is expressible in plain JSON
    // and used to make String() throw, which abandoned merging for the ENTIRE batch and
    // reintroduced the duplicate-entry shape this feature exists to prevent. The identity
    // guard makes the coercion total, so the bad value is simply ignored and the rest of
    // the batch still merges.
    it('should keep merging the rest of the batch when one identifier value is uncoercible', async () => {
      const hostile = JSON.parse('{"toString":null}')

      const mockRequestFn = await runBatch([
        profile({ 'Contact.$.email': 'dupe@example.com' }),
        profile({ 'Contact.$.email': 'dupe@example.com' }),
        profile({ 'Contact.$.email': hostile })
      ])

      expect(mockRequestFn).toHaveBeenCalledTimes(1)
      // The two duplicates still collapse; the uncoercible one stands alone
      expect(mockRequestFn.mock.calls[0][1].json.profiles).toHaveLength(2)

      // Grouping no longer fails, so metrics are still emitted
      expect(mockStatsClient.histogram).toHaveBeenCalled()
      expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Failed to merge overlapping profiles'))
    })

    it('should not group on values that cannot identify anyone', async () => {
      // Each case: three DIFFERENT people sharing one unusable identifier value
      const cases: Array<[string, unknown[]]> = [
        ['objects', [{ city: 'SF' }, { city: 'NYC' }, { city: 'LA' }]],
        ['booleans', [true, true, true]],
        ['NaN', [NaN, NaN, NaN]],
        ['arrays', [['a'], ['b'], ['c']]]
      ]

      for (const [label, values] of cases) {
        jest.clearAllMocks()
        const mockRequestFn = await runBatch([
          {
            memora_store: 'test-store-id',
            profile_identifiers: { 'Contact.$.email': `a-${label}@example.com`, 'Contact.$.x': values[0] },
            profile_traits: { 'Contact.$.firstName': 'A' }
          },
          {
            memora_store: 'test-store-id',
            profile_identifiers: { 'Contact.$.email': `b-${label}@example.com`, 'Contact.$.x': values[1] },
            profile_traits: { 'Contact.$.firstName': 'B' }
          },
          {
            memora_store: 'test-store-id',
            profile_identifiers: { 'Contact.$.email': `c-${label}@example.com`, 'Contact.$.x': values[2] },
            profile_traits: { 'Contact.$.firstName': 'C' }
          }
        ])

        // Three distinct people must stay three profiles
        expect(mockRequestFn.mock.calls[0][1].json.profiles).toHaveLength(3)
        expect(histogramValue('batch_largest_group')).toBe(1)
      }
    })

    it('should not union events whose key and value concatenate to the same string', async () => {
      // 'Contact.$.a' + 'b=c' and 'Contact.$.a=b' + 'c' both render as 'Contact.$.a=b=c'
      const mockRequestFn = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.a': 'b=c' },
          profile_traits: { 'Contact.$.firstName': 'A' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.a=b': 'c' },
          profile_traits: { 'Contact.$.firstName': 'B' }
        }
      ])

      expect(mockRequestFn.mock.calls[0][1].json.profiles).toHaveLength(2)
      expect(histogramValue('batch_overlapping_events')).toBe(0)
      expect(histogramValue('batch_largest_group')).toBe(1)
    })

    it('should still merge through a usable identifier when another value is unusable', async () => {
      // The guard is per value, not per event: the shared email must still merge these two
      const mockRequestFn = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'same@example.com', 'Contact.$.addr': { city: 'SF' } },
          profile_traits: { 'Contact.$.firstName': 'A' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'same@example.com', 'Contact.$.addr': { city: 'NY' } },
          profile_traits: { 'Contact.$.lastName': 'B' }
        }
      ])

      const sent = mockRequestFn.mock.calls[0][1].json.profiles
      expect(sent).toHaveLength(1)
      // The unusable value is excluded from GROUPING but still sent as data
      expect(sent[0].traits.Contact.addr).toEqual({ city: 'NY' })
      expect(sent[0].traits.Contact.firstName).toBe('A')
      expect(sent[0].traits.Contact.lastName).toBe('B')
    })

    it('should deliver the batch even if the stats client itself throws', async () => {
      const throwingStatsContext = {
        statsClient: {
          ...mockStatsClient,
          histogram: jest.fn(() => {
            throw new Error('statsd exploded')
          })
        },
        tags: ['env:test']
      }

      const mockRequestFn = await runBatch(
        [profile({ 'Contact.$.email': 'a@example.com' }), profile({ 'Contact.$.email': 'a@example.com' })],
        throwingStatsContext
      )

      expect(mockRequestFn).toHaveBeenCalledTimes(1)
      // Merging is unaffected by the stats failure: both events share an email, so one profile
      expect(mockRequestFn.mock.calls[0][1].json.profiles).toHaveLength(1)
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to report identifier overlap'))
    })
  })

  describe('merging overlapping profiles', () => {
    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      crit: jest.fn(),
      log: jest.fn(),
      level: ''
    }

    const runBatch = async (payloads: Payload[]) => {
      const mockRequestFn = jest.fn().mockResolvedValue({ status: 202, data: {}, headers: { get: () => null } })
      const multiStatus = await Destination.actions.upsertProfile.performBatch!(
        mockRequestFn as unknown as RequestClient,
        { payload: payloads, settings: defaultSettings, logger: mockLogger as any }
      )
      return { sent: mockRequestFn.mock.calls[0]?.[1]?.json?.profiles, multiStatus, mockRequestFn }
    }

    // Look profiles up by their contents. Position within the request body is deterministic
    // but not meaningful -- Memora matches profiles by identifier, not by slot -- so asserting
    // on order would fail on a harmless reordering of the bucketing loop.
    const findProfile = (sent: any[], predicate: (contact: any) => boolean) =>
      sent.find((p: any) => predicate(p.traits.Contact))

    beforeEach(() => {
      jest.clearAllMocks()
      nock.cleanAll()
    })

    it('should merge events that share an identifier into a single profile', async () => {
      const ids = { 'Contact.$.email': 'email1@example.com', 'Contact.$.phone': '+15550001' }
      const { sent } = await runBatch([
        { memora_store: 'test-store-id', profile_identifiers: ids, profile_traits: { 'Contact.$.firstName': 'A' } },
        { memora_store: 'test-store-id', profile_identifiers: ids, profile_traits: { 'Contact.$.lastName': 'B' } },
        { memora_store: 'test-store-id', profile_identifiers: ids, profile_traits: { 'Contact.$.city': 'SF' } }
      ])

      expect(sent).toHaveLength(1)
      // Non-conflicting traits from every event survive the merge
      expect(sent[0].traits.Contact).toEqual({
        email: 'email1@example.com',
        phone: '+15550001',
        firstName: 'A',
        lastName: 'B',
        city: 'SF'
      })
    })

    it('should let the later event win on a conflicting trait', async () => {
      const ids = { 'Contact.$.email': 'dupe@example.com' }
      const { sent } = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: ids,
          profile_traits: { 'Contact.$.firstName': 'Stale', 'Contact.$.city': 'SF' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: ids,
          profile_traits: { 'Contact.$.firstName': 'Fresh' }
        }
      ])

      expect(sent).toHaveLength(1)
      expect(sent[0].traits.Contact.firstName).toBe('Fresh')
      // A trait only the earlier event set is preserved rather than dropped wholesale
      expect(sent[0].traits.Contact.city).toBe('SF')
    })

    it('should let the later event win on a conflicting identifier', async () => {
      const { sent } = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'dupe@example.com', 'Contact.$.phone': '+15550001' },
          profile_traits: { 'Contact.$.firstName': 'A' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'dupe@example.com', 'Contact.$.phone': '+15559999' },
          profile_traits: { 'Contact.$.firstName': 'B' }
        }
      ])

      expect(sent).toHaveLength(1)
      expect(sent[0].traits.Contact.phone).toBe('+15559999')
      expect(sent[0].traits.Contact.firstName).toBe('B')
    })

    it('should merge transitively linked events into one profile', async () => {
      const pair = { 'Contact.$.email': 'email1@example.com', 'Contact.$.phone': '+15550001' }
      const { sent } = await runBatch([
        { memora_store: 'test-store-id', profile_identifiers: pair, profile_traits: { 'Contact.$.a': '1' } },
        { memora_store: 'test-store-id', profile_identifiers: pair, profile_traits: { 'Contact.$.b': '2' } },
        { memora_store: 'test-store-id', profile_identifiers: pair, profile_traits: { 'Contact.$.c': '3' } },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'email1@example.com' },
          profile_traits: { 'Contact.$.d': '4' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.phone': '+15550001' },
          profile_traits: { 'Contact.$.e': '5' }
        }
      ])

      expect(sent).toHaveLength(1)
      expect(sent[0].traits.Contact).toMatchObject({ a: '1', b: '2', c: '3', d: '4', e: '5' })
    })

    // Guards the `find()` call in the bucketing loop. Every other fixture unions into
    // index 0's root, so parent chains never exceed depth 1 and reading `parent[index]`
    // directly would pass. Here root 0 is ABSORBED under a later root, so only a true
    // find() resolves all four events to one profile.
    it('should merge a group whose root was absorbed by a later union', async () => {
      const { sent } = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.a': '1' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com', 'Contact.$.phone': '+1555' },
          profile_traits: { 'Contact.$.b': '2' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.externalId': 'ext-1' },
          profile_traits: { 'Contact.$.c': '3' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.phone': '+1555', 'Contact.$.externalId': 'ext-1' },
          profile_traits: { 'Contact.$.d': '4' }
        }
      ])

      expect(sent).toHaveLength(1)
      expect(sent[0].traits.Contact).toMatchObject({ a: '1', b: '2', c: '3', d: '4' })
    })

    it('should merge two independent groups without leaking traits between them', async () => {
      const { sent } = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'alice@example.com' },
          profile_traits: { 'Contact.$.firstName': 'Alice', 'Contact.$.city': 'SF' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'alice@example.com' },
          profile_traits: { 'Contact.$.firstName': 'Alice2' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'bob@example.com' },
          profile_traits: { 'Contact.$.firstName': 'Bob', 'Contact.$.country': 'UK' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'bob@example.com' },
          profile_traits: { 'Contact.$.firstName': 'Bob2' }
        }
      ])

      expect(sent).toHaveLength(2)

      const alice = findProfile(sent, (c) => c.email === 'alice@example.com')
      const bob = findProfile(sent, (c) => c.email === 'bob@example.com')

      // Each group applies later-wins independently
      expect(alice.traits.Contact).toEqual({ email: 'alice@example.com', firstName: 'Alice2', city: 'SF' })
      expect(bob.traits.Contact).toEqual({ email: 'bob@example.com', firstName: 'Bob2', country: 'UK' })

      // No cross-contamination: Alice must not acquire Bob's country, nor Bob Alice's city
      expect(alice.traits.Contact.country).toBeUndefined()
      expect(bob.traits.Contact.city).toBeUndefined()
    })

    it('should merge two groups whose events are interleaved in the batch', async () => {
      // Members are NOT contiguous: A, B, A, B
      const { sent } = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.a1': 'yes' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'b@example.com' },
          profile_traits: { 'Contact.$.b1': 'yes' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.a2': 'yes' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'b@example.com' },
          profile_traits: { 'Contact.$.b2': 'yes' }
        }
      ])

      expect(sent).toHaveLength(2)
      expect(findProfile(sent, (c) => c.email === 'a@example.com').traits.Contact).toEqual({
        email: 'a@example.com',
        a1: 'yes',
        a2: 'yes'
      })
      expect(findProfile(sent, (c) => c.email === 'b@example.com').traits.Contact).toEqual({
        email: 'b@example.com',
        b1: 'yes',
        b2: 'yes'
      })
    })

    it('should merge two transitively-linked groups that are interleaved', async () => {
      // Group A linked via email+phone, group B via userId+externalId, interleaved.
      // Neither group shares any identifier value with the other.
      const { sent, multiStatus } = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com', 'Contact.$.phone': '+1111' },
          profile_traits: { 'Contact.$.a1': '1' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.userId': 'u-b', 'Contact.$.externalId': 'x-b' },
          profile_traits: { 'Contact.$.b1': '1' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.phone': '+1111' },
          profile_traits: { 'Contact.$.a2': '2' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.externalId': 'x-b' },
          profile_traits: { 'Contact.$.b2': '2' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.a3': '3' }
        }
      ])

      expect(sent).toHaveLength(2)
      const groupA = findProfile(sent, (c) => c.a1 !== undefined)
      const groupB = findProfile(sent, (c) => c.b1 !== undefined)

      expect(groupA.traits.Contact).toMatchObject({ a1: '1', a2: '2', a3: '3' })
      expect(groupB.traits.Contact).toMatchObject({ b1: '1', b2: '2' })
      // Group A's traits must not appear on group B
      expect(groupB.traits.Contact.a1).toBeUndefined()
      expect(groupA.traits.Contact.b1).toBeUndefined()

      // All five original events still get their own result
      expect(multiStatus.length()).toBe(5)
      for (let i = 0; i < 5; i++) {
        expect(multiStatus.isSuccessResponseAtIndex(i)).toBe(true)
      }
    })

    it('should handle two merged groups alongside an unmergeable singleton', async () => {
      const { sent } = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.n': 'a1' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'solo@example.com' },
          profile_traits: { 'Contact.$.n': 'solo' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'b@example.com' },
          profile_traits: { 'Contact.$.n': 'b1' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.n': 'a2' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'b@example.com' },
          profile_traits: { 'Contact.$.n': 'b2' }
        }
      ])

      expect(sent).toHaveLength(3)
      expect(sent.map((p: any) => p.traits.Contact.n).sort()).toEqual(['a2', 'b2', 'solo'])
    })

    it('should not copy inherited properties into a merged profile', async () => {
      // The first event creates a real own `Contact` group. The second carries a
      // `__proto__.$.Contact` trait key, which pollutes Object.prototype while the batch is
      // still being validated. Merging then runs: without the own-property guard,
      // `merged['Contact']` is an inherited read and the spread copies the injected traits
      // into the first event's outgoing profile.
      try {
        const { sent } = await runBatch([
          {
            memora_store: 'test-store-id',
            profile_identifiers: { 'Contact.$.email': 'a@example.com' },
            profile_traits: { 'Contact.$.firstName': 'A' }
          },
          {
            memora_store: 'test-store-id',
            profile_identifiers: { 'Contact.$.email': 'b@example.com' },
            profile_traits: { '__proto__.$.Contact': { leaked: 'INJECTED' } as never }
          }
        ])

        // Assert on what is actually serialised: reading `.Contact` off the payload would
        // itself walk the polluted prototype and give a false positive.
        expect(JSON.stringify(sent)).not.toContain('INJECTED')
      } finally {
        delete (Object.prototype as unknown as Record<string, unknown>).Contact
      }
    })

    it('should leave non-overlapping events as separate profiles', async () => {
      const { sent } = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'a@example.com' },
          profile_traits: { 'Contact.$.firstName': 'A' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'b@example.com' },
          profile_traits: { 'Contact.$.firstName': 'B' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: { 'Contact.$.email': 'c@example.com' },
          profile_traits: { 'Contact.$.firstName': 'C' }
        }
      ])

      expect(sent).toHaveLength(3)
      expect(sent.map((p: any) => p.traits.Contact.firstName).sort()).toEqual(['A', 'B', 'C'])
    })

    it('should merge trait groups independently of each other', async () => {
      const ids = { 'Contact.$.email': 'dupe@example.com' }
      const { sent } = await runBatch([
        {
          memora_store: 'test-store-id',
          profile_identifiers: ids,
          profile_traits: { 'Contact.$.firstName': 'A', 'PurchaseHistory.$.lastOrder': 'o1' }
        },
        {
          memora_store: 'test-store-id',
          profile_identifiers: ids,
          profile_traits: { 'PurchaseHistory.$.lastOrder': 'o2', 'PurchaseHistory.$.total': '99' }
        }
      ])

      expect(sent).toHaveLength(1)
      expect(sent[0].traits.Contact.firstName).toBe('A')
      expect(sent[0].traits.PurchaseHistory).toEqual({ lastOrder: 'o2', total: '99' })
    })

    it('should report success for every original event index when events are merged', async () => {
      const ids = { 'Contact.$.email': 'dupe@example.com' }
      const { sent, multiStatus } = await runBatch([
        { memora_store: 'test-store-id', profile_identifiers: ids, profile_traits: { 'Contact.$.firstName': 'A' } },
        { memora_store: 'test-store-id', profile_identifiers: ids, profile_traits: { 'Contact.$.firstName': 'B' } },
        { memora_store: 'test-store-id', profile_identifiers: ids, profile_traits: { 'Contact.$.firstName': 'C' } }
      ])

      // Three events collapse into one upstream profile, but each event still gets a result
      expect(sent).toHaveLength(1)
      expect(multiStatus.length()).toBe(3)
      for (let i = 0; i < 3; i++) {
        expect(multiStatus.isSuccessResponseAtIndex(i)).toBe(true)
      }
    })

    it('should merge valid events while still reporting invalid ones as errors', async () => {
      const ids = { 'Contact.$.email': 'dupe@example.com' }
      const { sent, multiStatus } = await runBatch([
        { memora_store: 'test-store-id', profile_identifiers: ids, profile_traits: { 'Contact.$.firstName': 'A' } },
        { memora_store: 'test-store-id', profile_identifiers: {}, profile_traits: { 'Contact.$.firstName': 'Bad' } },
        { memora_store: 'test-store-id', profile_identifiers: ids, profile_traits: { 'Contact.$.firstName': 'C' } }
      ])

      expect(sent).toHaveLength(1)
      expect(sent[0].traits.Contact.firstName).toBe('C')
      expect(multiStatus.isSuccessResponseAtIndex(0)).toBe(true)
      expect(multiStatus.isErrorResponseAtIndex(1)).toBe(true)
      expect(multiStatus.isSuccessResponseAtIndex(2)).toBe(true)
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

        const result = await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })

        expect(result).toBeDefined()
        expect(result.choices).toEqual([
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

        const result = await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })

        expect(result).toBeDefined()
        expect(result.choices).toEqual([{ label: 'store-no-name', value: 'store-no-name' }])
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

        const result = await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: settingsWithTwilio,
          payload: {}
        })

        expect(result).toBeDefined()
        expect(result.choices).toEqual([{ label: 'Store One', value: 'store-1' }])
      })

      it('should handle empty stores list', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(200, {
            stores: [],
            meta: { pageSize: 100 }
          })

        const result = await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })

        expect(result).toBeDefined()
        expect(result.choices).toEqual([])
      })

      it('should return error when a store detail request fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(200, { stores: ['store-1'] })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-1`)
          .reply(500, { message: 'Internal server error' })

        const result = await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })

        expect(result).toBeDefined()
        expect(result.choices).toEqual([])
        expect(result.error).toBeDefined()
        expect(result.error!.message).toContain('Unable to fetch memora stores')
        expect(result.error!.code).toBe('FETCH_ERROR')
      })

      it('should return error message when API call fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(500, { message: 'Internal server error' })

        const result = await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })

        expect(result).toBeDefined()
        expect(result.choices).toEqual([])
        expect(result.error).toBeDefined()
        expect(result.error!.message).toContain('Unable to fetch memora stores')
        expect(result.error!.message).toContain('Please check your authentication credentials.')
        expect(result.error!.code).toBe('FETCH_ERROR')
      })
    })

    describe('profile_identifiers (dynamic identifiers from all trait groups)', () => {
      it('should fetch and return identifier traits from all trait groups including non-STRING types', async () => {
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
              },
              {
                displayName: 'Device',
                description: 'Device traits',
                traits: {
                  deviceId: {
                    dataType: 'NUMBER',
                    description: 'Numeric device identifier',
                    displayName: 'Device ID',
                    idTypePromotion: 'device_id',
                    validationRule: null
                  },
                  osVersion: {
                    dataType: 'STRING',
                    description: 'OS version',
                    displayName: 'OS Version',
                    idTypePromotion: null,
                    validationRule: null
                  }
                },
                version: 1
              }
            ]
          })

        const result = await testDestination.testDynamicField('upsertProfile', 'profile_identifiers.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })

        expect(result).toBeDefined()
        // Should return all traits with idTypePromotion set, regardless of dataType
        expect(result.choices).toEqual([
          { label: 'Contact.email', value: 'Contact.$.email', description: 'Contact - email (email)' },
          { label: 'Contact.phone', value: 'Contact.$.phone', description: 'Contact - phone (phone)' },
          { label: 'Loyalty.Member ID', value: 'Loyalty.$.memberId', description: 'Loyalty member ID' },
          { label: 'Device.Device ID', value: 'Device.$.deviceId', description: 'Numeric device identifier' }
        ])
      })

      it('should return error when memora_store is not selected', async () => {
        const result = await testDestination.testDynamicField('upsertProfile', 'profile_identifiers.__keys__', {
          settings: defaultSettings,
          payload: {}
        })

        expect(result).toBeDefined()
        expect(result.choices).toEqual([])
        expect(result.error).toBeDefined()
        expect(result.error!.message).toBe('Please select a Memora Store first')
        expect(result.error!.code).toBe('STORE_REQUIRED')
      })

      it('should return error message when API call fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/test-store-id/TraitGroups?pageSize=100&includeTraits=true`)
          .reply(500, { message: 'Internal server error' })

        const result = await testDestination.testDynamicField('upsertProfile', 'profile_identifiers.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })

        expect(result).toBeDefined()
        expect(result.choices).toEqual([])
        expect(result.error).toBeDefined()
        expect(result.error!.message).toContain('Unable to fetch identifiers')
        expect(result.error!.code).toBe('FETCH_ERROR')
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
                  },
                  isSubscribed: {
                    dataType: 'BOOLEAN',
                    description: 'Email subscription status',
                    displayName: 'Is Subscribed',
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

        const result = await testDestination.testDynamicField('upsertProfile', 'profile_traits.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })

        expect(result).toBeDefined()
        // Should exclude identifiers (traits with idTypePromotion) but include all non-identifier traits regardless of dataType
        // All trait groups use traitGroupName.$.traitName format
        expect(result.choices).toEqual([
          { label: 'Contact.firstName', value: 'Contact.$.firstName', description: 'Contact - firstName (STRING)' },
          { label: 'Contact.lastName', value: 'Contact.$.lastName', description: 'Contact - lastName (STRING)' },
          { label: 'Contact.age', value: 'Contact.$.age', description: 'User age' },
          { label: 'Contact.Is Subscribed', value: 'Contact.$.isSubscribed', description: 'Email subscription status' },
          {
            label: 'PurchaseHistory.Last Purchase Date',
            value: 'PurchaseHistory.$.lastPurchaseDate',
            description: 'Date of last purchase'
          },
          {
            label: 'PurchaseHistory.Total Spent',
            value: 'PurchaseHistory.$.totalSpent',
            description: 'Total amount spent'
          },
          {
            label: 'PurchaseHistory.Favorite Category',
            value: 'PurchaseHistory.$.favoriteCategory',
            description: 'Favorite product category'
          }
        ])
      })

      it('should return error when memora_store is not selected', async () => {
        const result = await testDestination.testDynamicField('upsertProfile', 'profile_traits.__keys__', {
          settings: defaultSettings,
          payload: {}
        })

        expect(result).toBeDefined()
        expect(result.choices).toEqual([])
        expect(result.error).toBeDefined()
        expect(result.error!.message).toBe('Please select a Memora Store first')
        expect(result.error!.code).toBe('STORE_REQUIRED')
      })

      it('should return error message when API call fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/test-store-id/TraitGroups?pageSize=100&includeTraits=true`)
          .reply(500, { message: 'Internal server error' })

        const result = await testDestination.testDynamicField('upsertProfile', 'profile_traits.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })

        expect(result).toBeDefined()
        expect(result.choices).toEqual([])
        expect(result.error).toBeDefined()
        expect(result.error!.message).toContain('Unable to fetch traits')
        expect(result.error!.code).toBe('FETCH_ERROR')
      })
    })
  })
})
