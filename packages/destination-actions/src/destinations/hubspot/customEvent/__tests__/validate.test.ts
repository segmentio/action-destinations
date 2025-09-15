import { validate } from '../functions/validation-functions'
import { Payload } from '../generated-types'

const payload: Payload = {
  event_name: 'Test Event Name 1',
  record_details: {
    object_type: 'contact',
    email: 'bibitybobity@example.com'
  },
  properties: {
    custom_prop_str: 'Hello String! ', // Deliberate trailing space
    custom_prop_str2: ' Hello String! ', // Deliberate leading space
    custom_prop_number: 123.45,
    custom_prop_bool: true,
    custom_prop_numberish_string: 123.45,
    custom_prop_boolish_string: ' true', // Deliberate leading space
    custom_prop_boolish_string_2: 'false ', // Deliberate trailing space
    custom_prop_datetime: '2024-01-08T13:52:50.212Z',
    custom_prop_date: '2024-01-08',
    custom_prop_obj: {
      key1: 'value1',
      key2: 'value2'
    },
    custom_prop_arr: ['value1', 'value2']
  }
}

const expectedValidatedPayload: Payload = {
  event_name: 'test_event_name_1',
  record_details: {
    object_type: 'contact',
    email: 'bibitybobity@example.com'
  },
  properties: {
    custom_prop_str: 'Hello String!',
    custom_prop_str2: 'Hello String!',
    custom_prop_number: 123.45,
    custom_prop_bool: true,
    custom_prop_numberish_string: 123.45,
    custom_prop_boolish_string: true,
    custom_prop_boolish_string_2: false,
    custom_prop_datetime: '2024-01-08T13:52:50.212Z',
    custom_prop_date: '2024-01-08',
    custom_prop_obj: '{"key1":"value1","key2":"value2"}',
    custom_prop_arr: '["value1","value2"]'
  }
}

describe('Hubspot.customEvent', () => {
  it('validate function should ensure no leading or trailing spaces in properties sent to Hubspot', async () => {
    const validatedPayload = validate(payload)
    expect(validatedPayload).toEqual(expectedValidatedPayload)
  })
})
