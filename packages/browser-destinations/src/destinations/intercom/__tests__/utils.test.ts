import { convertDateToUnix, filterCustomTraits, isEmpty } from '../utils'

describe('Utils test', () => {
  test('ISO 8601 date string converts to unix', () => {
    const ISODate = '2021-09-23T22:28:55.111Z'
    const unixDate = 1632436135

    expect(convertDateToUnix(ISODate)).toEqual(unixDate)
  })

  test('custom traits will be filtered with traits object', () => {
    const traits = {
      name: 'ibum',
      age: 21,
      surf_quality: 'mid'
    }
    const reservedFields = ['name', 'age']

    expect(filterCustomTraits(reservedFields, traits)).toEqual({
      surf_quality: 'mid'
    })
  })

  test('custom traits will be filtered with undefined traits object', () => {
    const traits = undefined
    const reservedFields = ['name', 'age']

    expect(filterCustomTraits(reservedFields, traits)).toEqual({})
  })

  describe('isEmpty tests', () => {
    test('isEmpty returns true if object is empty', () => {
      const obj = {}
      expect(isEmpty(obj)).toBe(true)
    })

    test('isEmpty returns false if object is not empty', () => {
      const obj = { prop: 'value' }
      expect(isEmpty(obj)).toBe(false)
    })

    test('isEmpty works for undefined obj', () => {
      const obj = undefined
      expect(isEmpty(obj)).toBe(true)
    })
  })
})
