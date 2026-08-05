import { getDependenciesFor } from '../depends-on'

describe('depends-on getDependenciesFor', () => {
  test('multi-event field includes show_fields plus one condition per event', () => {
    const result = getDependenciesFor('delivery_category')
    expect(result.match).toBe('any')
    expect(result.conditions).toEqual([
      {
        fieldKey: 'show_fields',
        operator: 'is',
        value: true
      },
      {
        fieldKey: 'event_name',
        operator: 'is',
        value: 'Purchase'
      },
      {
        fieldKey: 'event_name',
        operator: 'is',
        value: 'InitiateCheckout'
      }
    ])
  })

  test('single-event field still includes its event condition', () => {
    const result = getDependenciesFor('num_items')
    expect(result.match).toBe('any')
    expect(result.conditions).toEqual([
      { fieldKey: 'show_fields', operator: 'is', value: true },
      { fieldKey: 'event_name', operator: 'is', value: 'InitiateCheckout' }
    ])
  })

  test('custom_event_name gates on show_fields and the CustomEvent event', () => {
    const result = getDependenciesFor('custom_event_name')
    expect(result.conditions).toEqual([
      { fieldKey: 'show_fields', operator: 'is', value: true },
      { fieldKey: 'event_name', operator: 'is', value: 'CustomEvent' }
    ])
  })

  test('show_fields condition uses a boolean value, not the string "true"', () => {
    const result = getDependenciesFor('status')
    const showFieldsCondition = result.conditions.find((c) => 'fieldKey' in c && c.fieldKey === 'show_fields')
    expect(showFieldsCondition).toEqual({ fieldKey: 'show_fields', operator: 'is', value: true })
  })

  test('unknown field returns only the show_fields condition', () => {
    const result = getDependenciesFor('not_a_real_field')
    expect(result.conditions).toEqual([{ fieldKey: 'show_fields', operator: 'is', value: true }])
  })
})
