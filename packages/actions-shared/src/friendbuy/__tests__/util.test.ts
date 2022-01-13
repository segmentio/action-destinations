import { createFriendbuyPayload, filterFriendbuyAttributes, isNonEmpty, parseDate } from '../util'

describe('isEmpty', () => {
  test('isEmpty', () => {
    expect(isNonEmpty(undefined)).toBe(false)
    expect(isNonEmpty('')).toBe(false)
    expect(isNonEmpty({})).toBe(false)
    expect(isNonEmpty([])).toBe(false)
    expect(isNonEmpty(null)).toBe(true)
    expect(isNonEmpty(0)).toBe(true)
    expect(isNonEmpty({ a: 'apple' })).toBe(true)
    expect(isNonEmpty(false)).toBe(true)
  })
})

describe('createFriendbuyPayload', () => {
  test('simple', () => {
    expect(
      createFriendbuyPayload([
        ['string', 'hello'],
        ['number', 42],
        ['boolean', true],
        ['object1', {}],
        ['object2', { a: 'apple' }],
        ['array1', []],
        ['array2', [1, 2, 3]]
      ])
    ).toEqual({
      string: 'hello',
      number: 42,
      boolean: true,
      object1: {},
      object2: { a: 'apple' },
      array1: [],
      array2: [1, 2, 3]
    })
  })

  test('dropEmpty', () => {
    expect(
      createFriendbuyPayload(
        [
          ['string', 'hello'],
          ['number', 42],
          ['boolean', true],
          ['object1', {}],
          ['object2', { a: 'apple' }],
          ['array1', []],
          ['array2', [1, 2, 3]]
        ],
        { dropEmpty: true }
      )
    ).toEqual({
      string: 'hello',
      number: 42,
      boolean: true,
      object2: { a: 'apple' },
      array2: [1, 2, 3]
    })
  })
})

describe('filterFriendbuyAttributes', () => {
  test('simple', () => {
    expect(
      filterFriendbuyAttributes('pub', {
        attribute1: 'string1',
        attribute2: 42,
        attribute3: 'string2',
        attribute4: { type: 'object' },
        attribute5: true
      })
    ).toEqual([
      ['attribute1', 'string1'],
      ['attribute3', 'string2']
    ])
  })

  test('birthday', () => {
    expect(
      filterFriendbuyAttributes('pub', {
        birthday: '2000-01-02'
      })
    ).toEqual([['birthday', { year: 2000, month: 1, day: 2 }]])
  })

  test('api', () => {
    expect(
      filterFriendbuyAttributes('mapi', {
        attribute1: 'string1',
        attribute2: 'string2'
      })
    ).toEqual([['additionalProperties', { attribute1: 'string1', attribute2: 'string2' }]])
  })
})

describe('parseDate', () => {
  test('YYYY-MM-DD', () => {
    expect(parseDate('2000-01-02')).toEqual({ year: 2000, month: 1, day: 2 })
    expect(parseDate('0000-01-02')).toEqual({ month: 1, day: 2 }) // Year "0000" is ignored.
    expect(parseDate('2001-02-03T00:00:00.000Z')).toEqual({ year: 2001, month: 2, day: 3 }) // Time part is ignored.
  })
  test('MM-DD', () => {
    expect(parseDate('03-10')).toEqual({ month: 3, day: 10 })
    expect(parseDate('99-98')).toEqual({ month: 99, day: 98 })
    expect(parseDate('02-03 23:59:59')).toEqual({ month: 2, day: 3 }) // Time part is ignored.
    expect(parseDate('9-10')).toBe(undefined) // Not enough digits in day.
    expect(parseDate('10-9')).toBe(undefined) // Not enough digits in month.
    expect(parseDate('99-100')).toBe(undefined) // Too many digits in day.
    expect(parseDate('100-99')).toBe(undefined) // Too many digits in month.
  })
})
