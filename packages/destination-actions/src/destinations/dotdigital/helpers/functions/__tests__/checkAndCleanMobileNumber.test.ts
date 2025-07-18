import checkAndCleanMobileNumber from '../checkAndCleanMobileNumber'

describe('checkAndCleanMobileNumber', () => {
  it('should remove non-numeric characters and return clean number', () => {
    expect(checkAndCleanMobileNumber('+1-234-567-8900')).toBe('12345678900')
    expect(checkAndCleanMobileNumber('(123) 456-7890')).toBe('1234567890')
    expect(checkAndCleanMobileNumber('123.456.7890')).toBe('1234567890')
    expect(checkAndCleanMobileNumber('123 456 7890')).toBe('1234567890')
  })

  it('should handle international numbers', () => {
    expect(checkAndCleanMobileNumber('+44 20 7946 0958')).toBe('442079460958')
    expect(checkAndCleanMobileNumber('+33 1 42 86 83 26')).toBe('33142868326')
  })

  it('should throw PayloadValidationError for invalid phone numbers', () => {
    expect(() => checkAndCleanMobileNumber('')).toThrow('Invalid mobile number value')
    expect(() => checkAndCleanMobileNumber('abc')).toThrow('Invalid mobile number value')
    expect(() => checkAndCleanMobileNumber('123')).toThrow('Invalid mobile number value') // too short
    expect(() => checkAndCleanMobileNumber('++--')).toThrow('Invalid mobile number value')
  })

  it('should accept valid length numbers', () => {
    expect(checkAndCleanMobileNumber('1234567')).toBe('1234567') // exactly minimum length
    expect(checkAndCleanMobileNumber('12345678')).toBe('12345678') // above minimum
    expect(checkAndCleanMobileNumber('123456789012345')).toBe('123456789012345') // maximum international length
  })

  it('should throw PayloadValidationError with correct message', () => {
    expect(() => checkAndCleanMobileNumber('123')).toThrow('Invalid mobile number value')
    expect(() => checkAndCleanMobileNumber('')).toThrow('Invalid mobile number value')
  })

  it('should handle numbers with various formats', () => {
    expect(checkAndCleanMobileNumber('+1 555 123 4567')).toBe('15551234567')
    expect(checkAndCleanMobileNumber('01142079460958')).toBe('01142079460958')
    expect(checkAndCleanMobileNumber('555-123-4567')).toBe('5551234567')
    expect(checkAndCleanMobileNumber('555.123.4567')).toBe('5551234567')
  })

  it('should remove all non-digit characters', () => {
    // '1-800-GET-HELP' becomes '1800' which is 4 digits < 7, should throw
    expect(() => checkAndCleanMobileNumber('1-800-GET-HELP')).toThrow('Invalid mobile number value')

    // '123-456-7890 ext. 123' becomes '1234567890123' which is 13 digits >= 7, should pass
    expect(checkAndCleanMobileNumber('123-456-7890 ext. 123')).toBe('1234567890123')
  })

  it('should handle edge cases', () => {
    expect(checkAndCleanMobileNumber('+12345678')).toBe('12345678') // exactly 8 digits after cleaning
    expect(() => checkAndCleanMobileNumber('++--##')).toThrow('Invalid mobile number value') // no digits
  })
})
