import { getMetadata } from '../utils'

describe('getMetadata', () => {
  it("drops currency/value_decimal/item_count for tracking types that don't support any event metadata", () => {
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
