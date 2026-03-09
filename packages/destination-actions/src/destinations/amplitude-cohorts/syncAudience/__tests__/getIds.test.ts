import { MultiStatusResponse } from '@segment/actions-core'
import { getIds } from '../functions'
import type { Payload } from '../generated-types'

describe('getIds function', () => {
  describe('with valid IDs', () => {
    it('should extract all user IDs when all are unique', () => {
      const msResponse = new MultiStatusResponse()
      const payloads: Payload[] = [
        {
          user_id: 'user1',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        },
        {
          user_id: 'user2',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        },
        {
          user_id: 'user3',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        }
      ]

      const map = new Map(payloads.map((p, i) => [i, p]))
      const ids = getIds(map, 'BY_USER_ID', msResponse, true)

      expect(ids).toEqual(['user1', 'user2', 'user3'])
      expect(msResponse.getResponseAtIndex(0)).toBeUndefined()
      expect(msResponse.getResponseAtIndex(1)).toBeUndefined()
      expect(msResponse.getResponseAtIndex(2)).toBeUndefined()
    })
  })

  describe('with duplicate IDs', () => {
    it('should deduplicate IDs and mark duplicates as errors', () => {
      const msResponse = new MultiStatusResponse()
      const payloads: Payload[] = [
        {
          user_id: 'user1',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        },
        {
          user_id: 'user2',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        },
        {
          user_id: 'user1', // Duplicate of index 0
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        },
        {
          user_id: 'user3',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        }
      ]

      const map = new Map(payloads.map((p, i) => [i, p]))
      const ids = getIds(map, 'BY_USER_ID', msResponse, true)

      // Should only include unique IDs
      expect(ids).toEqual(['user1', 'user2', 'user3'])

      // First occurrence should be valid
      expect(msResponse.getResponseAtIndex(0)).toBeUndefined()
      expect(msResponse.getResponseAtIndex(1)).toBeUndefined()

      // Duplicate should have error
      expect(msResponse.getResponseAtIndex(2)).toMatchObject({
        data: {
          body: {
            batch_size: 100,
            engage_fields: {
              segment_audience_key: "test_audience",
              segment_computation_class: "audience",
              segment_external_audience_id: "cohort123",
              traits_or_properties: {}
            },
            user_id: "user1"
          },
          errormessage: "Duplicate ID user1 of type User ID found in payload batch. The duplicate payload has been rejected. Each payload must have a unique ID for the specified ID Type.",
          errortype: "PAYLOAD_VALIDATION_FAILED",
          status: 400
        }
      })

      // Non-duplicate should be valid
      expect(msResponse.getResponseAtIndex(3)).toBeUndefined()
    })

    it('should handle multiple duplicates of the same ID', () => {
      const msResponse = new MultiStatusResponse()
      const payloads: Payload[] = [
        {
          user_id: 'duplicate_user',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        },
        {
          user_id: 'unique_user',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        },
        {
          user_id: 'duplicate_user', // First duplicate
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        },
        {
          user_id: 'duplicate_user', // Second duplicate
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: {},
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort123'
          },
          batch_size: 100
        }
      ]

      const map = new Map(payloads.map((p, i) => [i, p]))
      const ids = getIds(map, 'BY_USER_ID', msResponse, true)

      expect(ids).toEqual(['duplicate_user', 'unique_user'])
      expect(msResponse.getResponseAtIndex(0)).toBeUndefined()
      expect(msResponse.getResponseAtIndex(1)).toBeUndefined()
      expect(msResponse.getResponseAtIndex(2)).toBeDefined()
      expect(msResponse.getResponseAtIndex(3)).toBeDefined()
    })
  })
})
