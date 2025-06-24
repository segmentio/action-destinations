import { parseFieldValue, validateContentSid } from '../utils'

describe('Utils', () => {
  describe('parseFieldValue', () => {
    it('should return undefined for null, undefined, or empty values', () => {
      expect(parseFieldValue(null)).toBeUndefined()
      expect(parseFieldValue(undefined)).toBeUndefined()
      expect(parseFieldValue('')).toBeUndefined()
    })

    it('should extract value from bracket notation', () => {
      expect(parseFieldValue('Friendly Name [test]')).toBe('test')
      expect(parseFieldValue('Template Name [test]')).toBe('test')
    })

    it('should return original value if no brackets found', () => {
      expect(parseFieldValue('simple_value')).toBe('simple_value')
      expect(parseFieldValue('test')).toBe('test')
    })
  })

  describe('validateContentSid', () => {
    it('should validate correct Content SID format', () => {
      expect(validateContentSid('HX1234567890abcdef1234567890abcdef')).toBe(true)
      expect(validateContentSid('HX9876543210fedcba9876543210fedcba')).toBe(true)
    })

    it('should reject invalid Content SID format', () => {
      expect(validateContentSid('test')).toBe(false)
      expect(validateContentSid('HX123')).toBe(false)
      expect(validateContentSid('testg')).toBe(false)
      expect(validateContentSid('')).toBe(false)
    })
  })
})
