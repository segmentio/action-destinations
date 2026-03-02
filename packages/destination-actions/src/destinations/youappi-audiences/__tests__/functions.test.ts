import { getJSON } from '../sync/functions'
import { Payload } from '../sync/generated-types'
import { Settings } from '../generated-types'

describe('YouAppi Audiences - Helper Functions', () => {
  const mockSettings: Settings = {
    api_key: 'test-api-key-123'
  }

  describe('getJSON', () => {
    it('should construct proper request JSON for add operation with both IDFA and GAID', () => {
      const payloads: Payload[] = [
        {
          idfa: 'test-idfa-123',
          gaid: 'test-gaid-456',
          audience_name: 'Test Audience',
          audience_id: 'audience-id-123',
          traits_or_props: {
            'Test Audience': true
          },
          enable_batching: true,
          batch_size: 1000
        }
      ]

      const result = getJSON(payloads, mockSettings, 'add')

      // Verify API key
      expect(result).toHaveProperty('api_key', 'test-api-key-123')

      // Verify device identities structure
      expect(result).toHaveProperty('device_identities')
      expect(result.device_identities).toHaveLength(2)
      expect(result.device_identities).toContainEqual({
        type: 'IDFA',
        value: 'test-idfa-123'
      })
      expect(result.device_identities).toContainEqual({
        type: 'GAID',
        value: 'test-gaid-456'
      })

      // Verify audiences structure
      expect(result).toHaveProperty('audiences')
      expect(result.audiences).toHaveLength(1)
      expect(result.audiences[0]).toHaveProperty('audience_name', 'Test Audience')
      expect(result.audiences[0]).toHaveProperty('action', 'add')

      // Verify audience_id is a number (hash)
      expect(result.audiences[0]).toHaveProperty('audience_id')
      expect(typeof result.audiences[0].audience_id).toBe('number')

      // Verify the hash is generated from audience_id
      const expectedHash = [...'audience-id-123'].reduce((h, c) => (h = (h << 5) - h + c.charCodeAt(0) | 0), 0)
      expect(result.audiences[0].audience_id).toBe(expectedHash)
    })

    it('should construct proper request JSON for remove operation', () => {
      const payloads: Payload[] = [
        {
          idfa: 'test-idfa-456',
          gaid: 'test-gaid-456',
          audience_name: 'Test Audience',
          audience_id: 'audience-id-456',
          traits_or_props: {
            'Test Audience': false
          },
          enable_batching: true,
          batch_size: 1000
        }
      ]

      const result = getJSON(payloads, mockSettings, 'remove')

      expect(result.device_identities).toHaveLength(2)
      expect(result.device_identities).toContainEqual({
        type: 'IDFA',
        value: 'test-idfa-456'
      })
      expect(result.device_identities).toContainEqual({
        type: 'GAID',
        value: 'test-gaid-456'
      })
      expect(result.audiences[0]).toMatchObject({
        audience_name: 'Test Audience',
        action: 'remove'
      })

      // Verify audience_id hash for this specific audience_id
      const expectedHash = [...'audience-id-456'].reduce((h, c) => (h = (h << 5) - h + c.charCodeAt(0) | 0), 0)
      expect(result.audiences[0].audience_id).toBe(expectedHash)
    })

    it('should handle multiple payloads and flatten device identities', () => {
      const payloads: Payload[] = [
        {
          idfa: 'idfa-1',
          gaid: 'gaid-1',
          audience_name: 'Test Audience',
          audience_id: 'audience-id-1',
          traits_or_props: {
            'Test Audience': true
          },
          enable_batching: true,
          batch_size: 1000
        },
        {
          idfa: 'idfa-2',
          gaid: 'gaid-2',
          audience_name: 'Test Audience',
          audience_id: 'audience-id-2',
          traits_or_props: {
            'Test Audience': true
          },
          enable_batching: true,
          batch_size: 1000
        },
        {
          idfa: 'idfa-3',
          gaid: 'gaid-3',
          audience_name: 'Test Audience',
          audience_id: 'audience-id-3',
          traits_or_props: {
            'Test Audience': true
          },
          enable_batching: true,
          batch_size: 1000
        }
      ]

      const result = getJSON(payloads, mockSettings, 'add')

      // Should have 6 device identities total: idfa-1, gaid-1, idfa-2, gaid-2, idfa-3, gaid-3
      expect(result.device_identities).toHaveLength(6)

      // Verify all device identities are present
      expect(result.device_identities).toContainEqual({ type: 'IDFA', value: 'idfa-1' })
      expect(result.device_identities).toContainEqual({ type: 'GAID', value: 'gaid-1' })
      expect(result.device_identities).toContainEqual({ type: 'IDFA', value: 'idfa-2' })
      expect(result.device_identities).toContainEqual({ type: 'GAID', value: 'gaid-2' })
      expect(result.device_identities).toContainEqual({ type: 'IDFA', value: 'idfa-3' })
      expect(result.device_identities).toContainEqual({ type: 'GAID', value: 'gaid-3' })
    })

    it('should generate consistent audience_id hash for same audience_id string', () => {
      const payloads1: Payload[] = [
        {
          idfa: 'test-idfa',
          gaid: 'test-gaid',
          audience_name: 'My Test Audience',
          audience_id: 'consistent-id',
          traits_or_props: {
            'My Test Audience': true
          },
          enable_batching: true,
          batch_size: 1000
        }
      ]

      const payloads2: Payload[] = [
        {
          idfa: 'different-idfa',
          gaid: 'different-gaid',
          audience_name: 'My Test Audience',
          audience_id: 'consistent-id',
          traits_or_props: {
            'My Test Audience': true
          },
          enable_batching: true,
          batch_size: 1000
        }
      ]

      const result1 = getJSON(payloads1, mockSettings, 'add')
      const result2 = getJSON(payloads2, mockSettings, 'add')

      // Same audience_id string should produce same hash
      expect(result1.audiences[0].audience_id).toBe(result2.audiences[0].audience_id)

      // Verify it matches the expected hash value
      const expectedHash = [...'consistent-id'].reduce((h, c) => (h = (h << 5) - h + c.charCodeAt(0) | 0), 0)
      expect(result1.audiences[0].audience_id).toBe(expectedHash)
      expect(result2.audiences[0].audience_id).toBe(expectedHash)
    })

    it('should generate different audience_id hash for different audience_id strings', () => {
      const payloads1: Payload[] = [
        {
          idfa: 'test-idfa',
          gaid: 'test-gaid',
          audience_name: 'Audience A',
          audience_id: 'id-a',
          traits_or_props: {
            'Audience A': true
          },
          enable_batching: true,
          batch_size: 1000
        }
      ]

      const payloads2: Payload[] = [
        {
          idfa: 'test-idfa',
          gaid: 'test-gaid',
          audience_name: 'Audience B',
          audience_id: 'id-b',
          traits_or_props: {
            'Audience B': true
          },
          enable_batching: true,
          batch_size: 1000
        }
      ]

      const result1 = getJSON(payloads1, mockSettings, 'add')
      const result2 = getJSON(payloads2, mockSettings, 'add')

      // Different audience_id strings should produce different hashes
      expect(result1.audiences[0].audience_id).not.toBe(result2.audiences[0].audience_id)

      // Verify each hash matches its expected value
      const expectedHash1 = [...'id-a'].reduce((h, c) => (h = (h << 5) - h + c.charCodeAt(0) | 0), 0)
      const expectedHash2 = [...'id-b'].reduce((h, c) => (h = (h << 5) - h + c.charCodeAt(0) | 0), 0)
      expect(result1.audiences[0].audience_id).toBe(expectedHash1)
      expect(result2.audiences[0].audience_id).toBe(expectedHash2)
    })

    it('should use audience_id and audience_name from first payload for audiences array', () => {
      const payloads: Payload[] = [
        {
          idfa: 'idfa-1',
          gaid: 'gaid-1',
          audience_name: 'Primary Audience',
          audience_id: 'primary-id',
          traits_or_props: {
            'Primary Audience': true
          },
          enable_batching: true,
          batch_size: 1000
        },
        {
          idfa: 'idfa-2',
          gaid: 'gaid-2',
          audience_name: 'Primary Audience',
          audience_id: 'primary-id',
          traits_or_props: {
            'Primary Audience': true
          },
          enable_batching: true,
          batch_size: 1000
        }
      ]

      const result = getJSON(payloads, mockSettings, 'add')

      expect(result.audiences).toHaveLength(1)
      expect(result.audiences[0].audience_name).toBe('Primary Audience')

      // Verify hash is generated from first payload's audience_id
      const expectedHash = [...'primary-id'].reduce((h, c) => (h = (h << 5) - h + c.charCodeAt(0) | 0), 0)
      expect(result.audiences[0].audience_id).toBe(expectedHash)
    })

    it('should include both IDFA and GAID when both are present', () => {
      const payloads: Payload[] = [
        {
          idfa: 'test-idfa',
          gaid: 'test-gaid',
          audience_name: 'Multi-Platform Audience',
          audience_id: 'multi-id',
          traits_or_props: {
            'Multi-Platform Audience': true
          },
          enable_batching: true,
          batch_size: 1000
        }
      ]

      const result = getJSON(payloads, mockSettings, 'add')

      expect(result.device_identities).toHaveLength(2)
      expect(result.device_identities.some(id => id.type === 'IDFA')).toBe(true)
      expect(result.device_identities.some(id => id.type === 'GAID')).toBe(true)
    })
  })
})
