import { CachedError, CachedValue, CachedValueFactory } from '../CachedResponse'

describe('CachedValueFactory', () => {
  test('should throw an error when passed an invalid cached value string.', () => {
    expect(() => CachedValueFactory.fromString('invalid')).toThrowError('Invalid cached value')
  })

  test('should throw an error when passed an invalid cached error string.', () => {
    expect(() => CachedValueFactory.fromString('1:-:400')).toThrowError('Invalid cached value')
  })

  test('should create a CachedValue when passed a valid cached value string. type:-:status', () => {
    const cachedValue = CachedValueFactory.fromString('0:-:200')
    expect(cachedValue).toBeInstanceOf(CachedValue)
  })

  test('should create a CachedError when passed a valid cached error string. type:-:status:-:message:-:code', () => {
    const cachedError = CachedValueFactory.fromString('1:-:400:-:Bad Request:-:400')
    expect(cachedError).toBeInstanceOf(CachedError)
  })

  test('should throw exception if type is not success, or error.', () => {
    expect(() => {
      CachedValueFactory.fromString('3:-:400:-:Bad Request:-:400')
    }).toThrowError('Invalid cached value')
  })
})

describe('CachedValue', () => {
  test('should create string representation of CachedValue seperated by seperator :-:.', () => {
    const cachedValue = new CachedValue(200)
    expect(cachedValue.toString()).toEqual('0:-:200')
  })
})

describe('CachedError', () => {
  test('should create string representation of CachedError seperated by seperator :-:.', () => {
    const cachedError = new CachedError(400, 'Bad Request', '400')
    expect(cachedError.toString()).toEqual('1:-:400:-:Bad Request:-:400')
  })
})
