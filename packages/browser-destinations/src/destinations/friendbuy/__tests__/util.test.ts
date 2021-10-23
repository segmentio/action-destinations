import { createFriendbuyPayload, filterFriendbuyAttributes } from '../util'

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

  test('dropEmptyObjects', () => {
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
        { dropEmptyObjects: true }
      )
    ).toEqual({
      string: 'hello',
      number: 42,
      boolean: true,
      object2: { a: 'apple' },
      array1: [],
      array2: [1, 2, 3]
    })
  })
})

describe('filterFriendbuyAttributes', () => {
  test('simple', () => {
    expect(
      filterFriendbuyAttributes({
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
})
