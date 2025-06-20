import { mergeAndDeduplicateById, validate } from '../functions/validation-functions'
import { Payload } from '../generated-types'

const payload: Payload = {
  object_details: {
    object_type: 'contact',
    id_field_name: 'email',
    id_field_value: 'test-id_field_value',
    property_group: 'contact-information'
  },
  properties: {
    str_prop: 'Hello String! ', // deliberately added trailing space
    num_prop: 123.45,
    bool_prop: true,
    numberish_string_prop: '123.45',
    boolish_string_prop: 'true ', // deliberately added trailing space
    datetime_prop: '2024-01-08T13:52:50.212Z',
    date_prop: '2024-01-08',
    obj_prop: { key1: 'value1', key2: 'value2' },
    arr_prop: ['value1', 'value2']
  },
  sensitive_properties: {
    str_sprop: ' Hello String!', // deliberately added leading space
    num_sprop: 123.45,
    bool_sprop: true,
    numberish_string_sprop: '123.45',
    boolish_string_sprop: ' true', // diberately added leading space
    datetime_sprop: '2024-01-08T13:52:50.212Z',
    date_sprop: '2024-01-08',
    obj_sprop: { key1: 'value1', key2: 'value2' },
    arr_sprop: ['value1', 'value2']
  },
  association_sync_mode: 'sync',
  associations: [
    {
      object_type: 'company',
      association_label: 'Test Association label',
      id_field_name: 'company_id',
      id_field_value: 'comany_id_1'
    }
  ],
  enable_batching: false,
  batch_size: 1
}

const expectedValidatedPayload: Payload[] = [
  {
    association_sync_mode: 'sync',
    associations: [
      {
        association_label: 'Test Association label',
        id_field_name: 'company_id',
        id_field_value: 'comany_id_1',
        object_type: 'company'
      }
    ],
    batch_size: 1,
    enable_batching: false,
    object_details: {
      id_field_name: 'email',
      id_field_value: 'test-id_field_value',
      object_type: 'contact',
      property_group: 'contact-information'
    },
    properties: {
      arr_prop: '["value1","value2"]',
      bool_prop: true,
      boolish_string_prop: true,
      date_prop: '2024-01-08',
      datetime_prop: '2024-01-08T13:52:50.212Z',
      num_prop: 123.45,
      numberish_string_prop: '123.45',
      obj_prop: '{"key1":"value1","key2":"value2"}',
      str_prop: 'Hello String!'
    },
    sensitive_properties: {
      arr_sprop: '["value1","value2"]',
      bool_sprop: true,
      boolish_string_sprop: true,
      date_sprop: '2024-01-08',
      datetime_sprop: '2024-01-08T13:52:50.212Z',
      num_sprop: 123.45,
      numberish_string_sprop: '123.45',
      obj_sprop: '{"key1":"value1","key2":"value2"}',
      str_sprop: 'Hello String!'
    }
  }
]

describe('Hubspot.upsertObject', () => {
  it('validate function should ensure no leading or trailing spaces in properties sent to Hubspot', async () => {
    const validatedPayload = validate([payload])
    expect(validatedPayload).toEqual(expectedValidatedPayload)
  })
})

describe('mergeAndDeduplicateById', () => {
  const basePayload = (overrides: Partial<Payload> = {}) => ({
    object_details: {
      id_field_name: 'email',
      id_field_value: 'user@example.com',
      object_type: 'contact',
      ...((overrides.object_details as object) || {})
    },
    association_sync_mode: 'upsert',
    enable_batching: true,
    batch_size: 100,
    properties: { foo: 'bar' },
    sensitive_properties: { secret: '123' },
    timestamp: '2024-01-01T00:00:00.000Z',
    ...overrides
  })

  it('returns empty array for empty input', () => {
    expect(mergeAndDeduplicateById([])).toEqual([])
  })

  it('deduplicates payloads by id_field_value', () => {
    const payloads: Payload[] = [
      basePayload({ properties: { a: 1 }, timestamp: '2024-01-01T00:00:00.000Z' }),
      basePayload({ properties: { b: 2 }, timestamp: '2024-01-02T00:00:00.000Z' })
    ]
    const result = mergeAndDeduplicateById(payloads)
    expect(result).toHaveLength(1)
    expect(result[0].properties).toEqual({ a: 1, b: 2 })
    expect(result[0]).not.toHaveProperty('timestamp')
  })

  it('merges properties preferring latest timestamp', () => {
    const payloads: Payload[] = [
      basePayload({ properties: { foo: 'old', bar: 'keep' }, timestamp: '2024-01-01T00:00:00.000Z' }),
      basePayload({ properties: { foo: 'new' }, timestamp: '2024-01-03T00:00:00.000Z' })
    ]
    const result = mergeAndDeduplicateById(payloads)
    expect(result[0].properties).toEqual({ foo: 'new', bar: 'keep' })
  })

  it('merges sensitive_properties preferring latest timestamp', () => {
    const payloads: Payload[] = [
      basePayload({ sensitive_properties: { secret: 'old', keep: 'yes' }, timestamp: '2024-01-01T00:00:00.000Z' }),
      basePayload({ sensitive_properties: { secret: 'new' }, timestamp: '2024-01-03T00:00:00.000Z' })
    ]
    const result = mergeAndDeduplicateById(payloads)
    expect(result[0].sensitive_properties).toEqual({ secret: 'new', keep: 'yes' })
  })

  it('merges associations', () => {
    const assoc1 = {
      id_field_name: 'email',
      id_field_value: 'user@example.com',
      object_type: 'contact' as string,
      association_label: 'primary'
    }
    const assoc2 = {
      id_field_name: 'email',
      id_field_value: 'user@example.com',
      object_type: 'contact' as string,
      association_label: 'secondary'
    }
    const payloads: Payload[] = [
      basePayload({ associations: [assoc1], timestamp: '2024-01-01T00:00:00.000Z' }),
      basePayload({ associations: [assoc2], timestamp: '2024-01-02T00:00:00.000Z' })
    ]
    const result = mergeAndDeduplicateById(payloads)
    expect(result[0].associations).toHaveLength(2)
    expect(result[0].associations).toEqual(expect.arrayContaining([assoc1, assoc2]))
  })

  it('handles multiple ids and returns merged payloads for each', () => {
    const payloads: Payload[] = [
      basePayload({
        object_details: { id_field_name: 'email', id_field_value: 'a@example.com', object_type: 'contact' },
        properties: { foo: 1 }
      }),
      basePayload({
        object_details: { id_field_name: 'email', id_field_value: 'b@example.com', object_type: 'contact' },
        properties: { bar: 2 }
      })
    ]
    const result = mergeAndDeduplicateById(payloads)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.object_details.id_field_value).sort()).toEqual(['a@example.com', 'b@example.com'])
  })

  it('skips payloads without id_field_value', () => {
    const payloads: Payload[] = [
      basePayload({ object_details: { id_field_name: 'email', id_field_value: '', object_type: 'contact' } }),
      basePayload({ object_details: { id_field_name: 'email', id_field_value: null as any, object_type: 'contact' } }),
      basePayload({
        object_details: { id_field_name: 'email', id_field_value: 'valid@example.com', object_type: 'contact' }
      })
    ]
    const result = mergeAndDeduplicateById(payloads)
    expect(result).toHaveLength(1)
    expect(result[0].object_details.id_field_value).toBe('valid@example.com')
  })

  it('removes timestamp from final output', () => {
    const payloads: Payload[] = [basePayload({ timestamp: '2024-01-01T00:00:00.000Z' })]
    const result = mergeAndDeduplicateById(payloads)
    expect(result[0]).not.toHaveProperty('timestamp')
  })
})
