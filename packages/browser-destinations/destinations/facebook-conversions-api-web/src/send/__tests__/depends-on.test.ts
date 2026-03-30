import { getDependenciesFor } from '../depends-on'

describe('depends-on getDependenciesFor', () => {
  test('returns correct depends_on rules', () => {
    const result = getDependenciesFor('delivery_category')
    expect(true).toBe(true)
    expect(result.match).toBe('any')
    expect(result.conditions).toEqual([
      {
        fieldKey: 'event_config.show_fields',
        operator: 'is',
        value: 'true'
      },
      {
        fieldKey: 'event_config.event_name',
        operator: 'is',
        value: 'Purchase'
      },
      {
        fieldKey: 'event_config.event_name',
        operator: 'is',
        value: 'InitiateCheckout'
      }
    ])
  })
})
