import { getDataProcessingOptions, getMetadata } from '../utils'

describe('getMetadata', () => {
  it('drops currency/value_decimal/item_count for tracking types that don\'t support any event metadata', () => {
    const result = getMetadata({ currency: 'USD', item_count: 5, value_decimal: 10 }, undefined, undefined, 'Search')
    expect(result?.currency).toBeUndefined()
    expect(result?.item_count).toBeUndefined()
    expect(result?.value_decimal).toBeUndefined()
  })

  it('drops item_count but keeps currency/value_decimal for Lead/SignUp', () => {
    const result = getMetadata({ currency: 'USD', item_count: 5, value_decimal: 10 }, undefined, undefined, 'Lead')
    expect(result?.currency).toBe('USD')
    expect(result?.value_decimal).toBe(10)
    expect(result?.item_count).toBeUndefined()
  })
})

describe('getDataProcessingOptions', () => {
  it('returns undefined when the field is absent', () => {
    expect(getDataProcessingOptions(undefined)).toBeUndefined()
  })

  it('returns undefined for an empty object, so no empty data_processing_options is sent', () => {
    expect(getDataProcessingOptions({})).toBeUndefined()
  })

  it('omits the keys that did not resolve', () => {
    expect(getDataProcessingOptions({ country: 'US', region: 'CA' })).toEqual({ country: 'US', region: 'CA' })
  })

  it('splits modes into an array', () => {
    expect(getDataProcessingOptions({ country: 'US', modes: 'LDU', region: 'CA' })).toEqual({
      country: 'US',
      modes: ['LDU'],
      region: 'CA'
    })
  })
})
