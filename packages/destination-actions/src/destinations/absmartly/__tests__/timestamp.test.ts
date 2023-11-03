import { isValidTimestamp, unixTimestampOf } from '../timestamp'

describe('isValidTimestamp()', () => {
  it('should accept unix timestamp in milliseconds for dates between 2010 and 2050', async () => {
    expect(isValidTimestamp(-1592304000000)).toBe(false)
    expect(isValidTimestamp(0)).toBe(false)
    expect(isValidTimestamp(1262304000)).toBe(false)
    expect(isValidTimestamp(1262304000000)).toBe(true)
    expect(isValidTimestamp(1592304000000)).toBe(true)
    expect(isValidTimestamp(2524608000000)).toBe(true)
    expect(isValidTimestamp(5524608000000)).toBe(false)
  })

  it('should accept ISO 8601 timestamps', async () => {
    expect(isValidTimestamp('2000-01-01T00:00:00Z')).toBe(true)
    expect(isValidTimestamp('2023-01-01T00:00:00.003Z')).toBe(true)
    expect(isValidTimestamp('2023-01-01T00:00:00.00345Z')).toBe(true)
    expect(isValidTimestamp('2023-01-01T00:00:00.003456Z')).toBe(true)
    expect(isValidTimestamp('2023-01-01T00:00:00.0034-01:00')).toBe(true)
    expect(isValidTimestamp('2060-01-01T00:00:00Z')).toBe(true)
    expect(isValidTimestamp('2060-01-01 00:00:00Z')).toBe(true)
  })
})

describe('unixTimestampOf()', () => {
  it('should pass-through numbers', async () => {
    expect(unixTimestampOf(0)).toBe(0)
    expect(unixTimestampOf(1262304000)).toBe(1262304000)
    expect(unixTimestampOf(1262304000000)).toBe(1262304000000)
    expect(unixTimestampOf(1592304000000)).toBe(1592304000000)
  })

  it('should convert strings to number representing Unix timestamp in milliseconds', async () => {
    expect(unixTimestampOf('2000-01-01T00:00:00Z')).toBe(946684800000)
    expect(unixTimestampOf('2023-01-01T00:00:00.003Z')).toBe(1672531200003)
    expect(unixTimestampOf('2023-01-01T00:00:00.00345Z')).toBe(1672531200003)
    expect(unixTimestampOf('2023-01-01T00:00:00.003456Z')).toBe(1672531200003)
  })
})
