import { getId, getIdTypeName } from '../functions'
import type { Payload } from '../generated-types'

describe('syncAudience functions', () => {
  describe('getId', () => {
    it('should return user_id when id_type is BY_USER_ID', () => {
      const payload: Payload = {
        user_id: 'user123',
        engage_fields: {
          segment_computation_class: 'audience',
          traits_or_properties: {},
          segment_audience_key: 'test_audience',
          segment_external_audience_id: 'cohort123'
        },
        batch_size: 100
      }

      const result = getId(payload, 'BY_USER_ID')
      expect(result).toBe('user123')
    })

    it('should return amplitude_id when id_type is BY_AMP_ID', () => {
      const payload: Payload = {
        amplitude_id: 'amp456',
        engage_fields: {
          segment_computation_class: 'audience',
          traits_or_properties: {},
          segment_audience_key: 'test_audience',
          segment_external_audience_id: 'cohort123'
        },
        batch_size: 100
      }

      const result = getId(payload, 'BY_AMP_ID')
      expect(result).toBe('amp456')
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
})
