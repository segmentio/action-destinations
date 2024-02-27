import { tranformValueToAcceptedDataType } from '../sendgrid-properties'

describe('tranformValueToAcceptedDataType', () => {
  it('should transform a boolean value into a string', () => {
    expect(tranformValueToAcceptedDataType(true)).toBe('true')
  })

  it('should transform an array value into a string', () => {
    expect(tranformValueToAcceptedDataType([1, 2, 3])).toBe('[1,2,3]')
  })

  it('should transform an object value into a string', () => {
    expect(tranformValueToAcceptedDataType({ a: 1 })).toBe('{"a":1}')
  })

  it('should transform nested arrays and objects into a string', () => {
    const data = [[1, 2, 3], { a: 1, b: 2, c: { d: 3, e: ['f', 'g'] } }]
    expect(tranformValueToAcceptedDataType(data)).toBe('[[1,2,3],{"a":1,"b":2,"c":{"d":3,"e":["f","g"]}}]')
  })

  it('should return the value for number types', () => {
    expect(tranformValueToAcceptedDataType(123)).toBe(123)
  })

  it('should return the value for string types', () => {
    expect(tranformValueToAcceptedDataType('Hello, test')).toBe('Hello, test')
  })

  it('should return the value for date types', () => {
    expect(tranformValueToAcceptedDataType('2022-11-01T00:00:00Z')).toBe('2022-11-01T00:00:00Z')
  })
})
