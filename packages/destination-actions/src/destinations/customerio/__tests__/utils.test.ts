import { convertAttributeTimestamps, convertValidTimestamp, resolveIdentifiers, isIsoDate } from '../utils'

describe('isIsoDate', () => {
  it('should return true for valid ISO date with fractional seconds from 1-9 digits', () => {
    expect(isIsoDate('2023-12-25T14:30:45.1')).toBe(true) // 1 digit
    expect(isIsoDate('2023-12-25T14:30:45.12')).toBe(true) // 2 digits
    expect(isIsoDate('2023-12-25T14:30:45.123')).toBe(true) // 3 digits
    expect(isIsoDate('2023-12-25T14:30:45.1234')).toBe(true) // 4 digits
    expect(isIsoDate('2023-12-25T14:30:45.12345')).toBe(true) // 5 digits
    expect(isIsoDate('2023-12-25T14:30:45.123456')).toBe(true) // 6 digits
    expect(isIsoDate('2023-12-25T14:30:45.1234567')).toBe(true) // 7 digits
    expect(isIsoDate('2023-12-25T14:30:45.12345678')).toBe(true) // 8 digits
    expect(isIsoDate('2023-12-25T14:30:45.123456789')).toBe(true) // 9 digits
  })

  it('should return true for valid ISO date with fractional seconds and timezone', () => {
    expect(isIsoDate('2023-12-25T14:30:45.123Z')).toBe(true) // UTC
    expect(isIsoDate('2023-12-25T14:30:45.123456+05:30')).toBe(true) // timezone offset
    expect(isIsoDate('2023-12-25T14:30:45.123456789-08:00')).toBe(true) // negative timezone
  })

  it('should return true for valid ISO date without fractional seconds', () => {
    expect(isIsoDate('2023-12-25T14:30:45')).toBe(true)
    expect(isIsoDate('2023-12-25T14:30:45Z')).toBe(true)
    expect(isIsoDate('2023-12-25')).toBe(true) // date only
  })

  it('should return false for invalid fractional seconds i.e more than 9 digits', () => {
    expect(isIsoDate('2023-12-25T14:30:45.1234567890')).toBe(false) // 10 digits
    expect(isIsoDate('2023-12-25T14:30:45.12345678901')).toBe(false) // 11 digits
  })

  it('should return false for invalid date formats', () => {
    expect(isIsoDate('invalid-date')).toBe(false)
    expect(isIsoDate('2023-13-25')).toBe(false) // invalid month
    expect(isIsoDate('2023-12-32')).toBe(false) // invalid day
    expect(isIsoDate('2023-12-25T25:30:45')).toBe(false) // invalid hour
  })
})

describe('resolveIdentifiers', () => {
  it('should return object_id and object_type_id if both are provided', () => {
    const identifiers = { object_id: '123', object_type_id: '456' }

    expect(resolveIdentifiers(identifiers)).toEqual(identifiers)
  })

  it('should return cio_id if person_id starts with "cio_"', () => {
    const identifiers = { person_id: 'cio_123' }

    expect(resolveIdentifiers(identifiers)).toEqual({ cio_id: '123' })
  })

  it('should return email if person_id is a valid email', () => {
    const identifiers = { person_id: 'test@example.com' }

    expect(resolveIdentifiers(identifiers)).toEqual({ email: 'test@example.com' })
  })

  it('should return id if person_id is provided', () => {
    const identifiers = { person_id: '123' }

    expect(resolveIdentifiers(identifiers)).toEqual({ id: '123' })
  })

  it('should return email if email is provided', () => {
    const identifiers = { email: 'test@example.com' }

    expect(resolveIdentifiers(identifiers)).toEqual({ email: 'test@example.com' })
  })

  it('should return anonymous_id if anonymous_id is provided', () => {
    const identifiers = { anonymous_id: '123' }

    expect(resolveIdentifiers(identifiers)).toEqual({ anonymous_id: '123' })
  })

  it('should return undefined if no identifiers are provided', () => {
    expect(resolveIdentifiers({})).toBeUndefined()
  })
})

describe('convertValidTimestamp', () => {
  it('should leave decimal unix timestamps unchanged', () => {
    expect(convertValidTimestamp('1712345678.123')).toBe('1712345678.123')
  })

  it('should convert a 7-digit fractional second ISO timestamp to unix', () => {
    expect(convertValidTimestamp('2024-08-14T20:36:48.6527521Z')).toBe(1723667808)
  })

  it('should convert a 9-digit fractional second ISO timestamp to unix', () => {
    expect(convertValidTimestamp('2024-08-14T20:36:48.652752100Z')).toBe(1723667808)
  })

  it('should leave non-date strings unchanged', () => {
    expect(convertValidTimestamp('not-a-date')).toBe('not-a-date')
  })
})

describe('convertAttributeTimestamps — sub-millisecond fractional seconds (STRATCONN-4121)', () => {
  const realParse = Date.parse
  afterEach(() => jest.restoreAllMocks())

  it('converts a 7-digit fractional second timestamp when Date.parse rejects long fractions (prod runtime)', () => {
    jest.spyOn(Date, 'parse').mockImplementation((s: string) => {
      const m = /\.(\d+)/.exec(s)
      return m && m[1].length > 5 ? NaN : realParse(s)
    })
    const result = convertAttributeTimestamps({ createdat: '2024-08-14T20:36:48.6527521Z' })
    expect(result.createdat).toBe(1723667808)
  })

  it('converts a 9-digit fractional second timestamp when Date.parse rejects long fractions (prod runtime)', () => {
    jest.spyOn(Date, 'parse').mockImplementation((s: string) => {
      const m = /\.(\d+)/.exec(s)
      return m && m[1].length > 5 ? NaN : realParse(s)
    })
    const result = convertAttributeTimestamps({ ts: '2024-08-14T20:36:48.652752100Z' })
    expect(result.ts).toBe(1723667808)
  })

  it('still converts a standard 3-digit millisecond timestamp', () => {
    const result = convertAttributeTimestamps({ createdat: '2024-08-14T20:36:48.652Z' })
    expect(result.createdat).toBe(1723667808)
  })

  it('leaves non-date strings unchanged', () => {
    const result = convertAttributeTimestamps({ name: 'Acme Corp' })
    expect(result.name).toBe('Acme Corp')
  })
})
