import { validate } from '../functions/validation-functions'
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
