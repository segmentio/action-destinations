import { cleanData } from '../postConversion/formatter'

describe('formatter cleanData', () => {
  test('should return empty object', async () => {
    const res = cleanData({})
    expect(res).toEqual({})
  })

  test('should return object without undefined values', async () => {
    const testObj = {
      oid: '50314b8e9bcf000000000000',
      user_agent: 'testing',
      conversion_time: 1626897247530000,
      label: '5XAOCM2PipMCEOmqvM0C',
      value: undefined,
      currency_code: undefined
    }

    const expectedResult = {
      oid: '50314b8e9bcf000000000000',
      user_agent: 'testing',
      conversion_time: 1626897247530000,
      label: '5XAOCM2PipMCEOmqvM0C'
    }
    const res = cleanData(testObj)
    expect(res).toEqual(expectedResult)
  })

  test('should return object without empty string values', async () => {
    const testObj = {
      hashed_first_name: 'm7pcU6BUXgyAGEuUYVPJ9YOH470dTuNXQPKawucYsBk=',
      hashed_last_name: '',
      hashed_street_address: '',
      city: '',
      region: '',
      postcode: undefined,
      country: undefined
    }

    const res = cleanData(testObj)
    expect(res).toEqual({ hashed_first_name: 'm7pcU6BUXgyAGEuUYVPJ9YOH470dTuNXQPKawucYsBk=' })
  })

  test('should return object without empty array values', async () => {
    const testObj = {
      hashed_first_name: 'm7pcU6BUXgyAGEuUYVPJ9YOH470dTuNXQPKawucYsBk=',
      hashed_last_name: '',
      hashed_street_address: '',
      city: '',
      region: '',
      postcode: ['waaa', '', 'third'],
      country: []
    }

    const expectedResult = {
      hashed_first_name: 'm7pcU6BUXgyAGEuUYVPJ9YOH470dTuNXQPKawucYsBk=',
      postcode: ['waaa', 'third']
    }
    const res = cleanData(testObj)
    expect(res).toStrictEqual(expectedResult)
  })
})
