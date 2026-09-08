import { MultiStatusResponse } from '@segment/actions-core'
import { getId, getIdTypeName, getMembershipIdType, getJSON, failAllPayloads, handleError } from '../functions'
import type { Payload } from '../generated-types'

describe('syncAudience functions', () => {
  describe('getId', () => {
    it('should return user_id when id_type is BY_USER_ID', () => {
      const payload: Payload = {
        user_id: 'user123',
        segment_external_audience_id: 'cohort123',
        batch_size: 100
      }

      expect(getId(payload, 'BY_USER_ID')).toBe('user123')
    })

    it('should return amplitude_id when id_type is BY_AMP_ID', () => {
      const payload: Payload = {
        amplitude_id: 'amp456',
        segment_external_audience_id: 'cohort123',
        batch_size: 100
      }

      expect(getId(payload, 'BY_AMP_ID')).toBe('amp456')
    })

    it('should return undefined when user_id is missing and id_type is BY_USER_ID', () => {
      const payload: Payload = {
        amplitude_id: 'amp456',
        segment_external_audience_id: 'cohort123',
        batch_size: 100
      }

      expect(getId(payload, 'BY_USER_ID')).toBeUndefined()
    })

    it('should return undefined when amplitude_id is missing and id_type is BY_AMP_ID', () => {
      const payload: Payload = {
        user_id: 'user123',
        segment_external_audience_id: 'cohort123',
        batch_size: 100
      }

      expect(getId(payload, 'BY_AMP_ID')).toBeUndefined()
    })

    it('should return undefined for an unknown id_type', () => {
      const payload: Payload = {
        user_id: 'user123',
        amplitude_id: 'amp456',
        segment_external_audience_id: 'cohort123',
        batch_size: 100
      }

      expect(getId(payload, 'UNKNOWN' as any)).toBeUndefined()
    })
  })

  describe('getIdTypeName', () => {
    it('should return "User ID" for BY_USER_ID', () => {
      expect(getIdTypeName('BY_USER_ID')).toBe('User ID')
    })

    it('should return "Amplitude ID" for BY_AMP_ID', () => {
      expect(getIdTypeName('BY_AMP_ID')).toBe('Amplitude ID')
    })
  })

  describe('getMembershipIdType', () => {
    it('should return BY_NAME for BY_USER_ID', () => {
      expect(getMembershipIdType('BY_USER_ID')).toBe('BY_NAME')
    })

    it('should return BY_AMP_ID for BY_AMP_ID', () => {
      expect(getMembershipIdType('BY_AMP_ID')).toBe('BY_AMP_ID')
    })
  })

  describe('getJSON', () => {
    it('should return correct JSON structure for ADD operation with BY_USER_ID', () => {
      const msResponse = new MultiStatusResponse()
      const payloads: Payload[] = [
        { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 },
        { user_id: 'user2', segment_external_audience_id: 'cohort_1', batch_size: 100 }
      ]
      const map = new Map(payloads.map((p, i) => [i, p]))

      const result = getJSON(map, 'BY_USER_ID', 'cohort_1', msResponse, 'ADD', true)

      expect(result).toEqual({
        cohort_id: 'cohort_1',
        skip_invalid_ids: true,
        memberships: [{
          ids: ['user1', 'user2'],
          id_type: 'BY_NAME',
          operation: 'ADD'
        }]
      })
    })

    it('should return correct JSON structure for REMOVE operation with BY_AMP_ID', () => {
      const msResponse = new MultiStatusResponse()
      const payloads: Payload[] = [
        { amplitude_id: 'amp1', segment_external_audience_id: 'cohort_2', batch_size: 100 },
        { amplitude_id: 'amp2', segment_external_audience_id: 'cohort_2', batch_size: 100 }
      ]
      const map = new Map(payloads.map((p, i) => [i, p]))

      const result = getJSON(map, 'BY_AMP_ID', 'cohort_2', msResponse, 'REMOVE', true)

      expect(result).toEqual({
        cohort_id: 'cohort_2',
        skip_invalid_ids: true,
        memberships: [{
          ids: ['amp1', 'amp2'],
          id_type: 'BY_AMP_ID',
          operation: 'REMOVE'
        }]
      })
    })

    it('should return undefined when all payloads have missing IDs', () => {
      const msResponse = new MultiStatusResponse()
      const payloads: Payload[] = [
        { segment_external_audience_id: 'cohort_1', batch_size: 100 },
        { segment_external_audience_id: 'cohort_1', batch_size: 100 }
      ]
      const map = new Map(payloads.map((p, i) => [i, p]))

      const result = getJSON(map, 'BY_USER_ID', 'cohort_1', msResponse, 'ADD', true)

      expect(result).toBeUndefined()
    })

    it('should exclude duplicate IDs and set errors for duplicates', () => {
      const msResponse = new MultiStatusResponse()
      const payloads: Payload[] = [
        { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 },
        { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 },
        { user_id: 'user2', segment_external_audience_id: 'cohort_1', batch_size: 100 }
      ]
      const map = new Map(payloads.map((p, i) => [i, p]))

      const result = getJSON(map, 'BY_USER_ID', 'cohort_1', msResponse, 'ADD', true)

      expect(result).toEqual({
        cohort_id: 'cohort_1',
        skip_invalid_ids: true,
        memberships: [{
          ids: ['user1', 'user2'],
          id_type: 'BY_NAME',
          operation: 'ADD'
        }]
      })

      expect(msResponse.getResponseAtIndex(1)).toMatchObject({
        data: {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'Duplicate ID user1 of type User ID found in payload batch. The duplicate payload has been rejected. Each payload must have a unique ID for the specified ID Type.',
          body: { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 }
        }
      })
    })
  })

  describe('handleError', () => {
    it('should set error on msResponse in batch mode', () => {
      const msResponse = new MultiStatusResponse()
      const payload: Payload = { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 }

      handleError(payload, msResponse, 0, true, 'Test error message', 'PAYLOAD_VALIDATION_FAILED')

      expect(msResponse.getResponseAtIndex(0)).toMatchObject({
        data: {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'Test error message',
          body: { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 }
        }
      })
    })

    it('should include sent data when provided in batch mode', () => {
      const msResponse = new MultiStatusResponse()
      const payload: Payload = { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 }
      const sent = { cohort_id: 'cohort_1', memberships: [{ ids: ['user1'] }] }

      handleError(payload, msResponse, 0, true, 'Test error', 'UNKNOWN_ERROR', sent as any)

      expect(msResponse.getResponseAtIndex(0)).toMatchObject({
        data: {
          status: 400,
          errortype: 'UNKNOWN_ERROR',
          errormessage: 'Test error',
          body: { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 },
          sent: { cohort_id: 'cohort_1', memberships: [{ ids: ['user1'] }] }
        }
      })
    })

    it('should throw PayloadValidationError in non-batch mode', () => {
      const msResponse = new MultiStatusResponse()
      const payload: Payload = { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 }

      expect(() => {
        handleError(payload, msResponse, 0, false, 'Validation failed', 'PAYLOAD_VALIDATION_FAILED')
      }).toThrowError('Validation failed')
    })
  })

  describe('failAllPayloads', () => {
    it('should set errors on all payloads in batch mode and return msResponse', () => {
      const msResponse = new MultiStatusResponse()
      const payloads: Payload[] = [
        { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 },
        { user_id: 'user2', segment_external_audience_id: 'cohort_1', batch_size: 100 }
      ]

      const result = failAllPayloads(payloads, msResponse, true, 'All failed')

      expect(result).toBe(msResponse)
      expect(msResponse.getResponseAtIndex(0)).toMatchObject({
        data: {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'All failed',
          body: { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 }
        }
      })
      expect(msResponse.getResponseAtIndex(1)).toMatchObject({
        data: {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'All failed',
          body: { user_id: 'user2', segment_external_audience_id: 'cohort_1', batch_size: 100 }
        }
      })
    })

    it('should throw PayloadValidationError in non-batch mode', () => {
      const msResponse = new MultiStatusResponse()
      const payloads: Payload[] = [
        { user_id: 'user1', segment_external_audience_id: 'cohort_1', batch_size: 100 }
      ]

      expect(() => {
        failAllPayloads(payloads, msResponse, false, 'All failed')
      }).toThrowError('All failed')
    })
  })
})
