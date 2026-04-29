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

  describe('empty string handling', () => {
    it('should keep empty strings as strings instead of coercing to 0', () => {
      const payloadWithEmptyString: Payload = {
        event_name: 'Test Event',
        record_details: {
          object_type: 'contact',
          email: 'test@example.com'
        },
        properties: {
          some_prop: ''
        }
      }

      const result = validate(payloadWithEmptyString)

      expect(result.properties?.some_prop).toBe('')
    })

    it('should keep multiple empty strings as strings', () => {
      const payloadWithMultipleEmpty: Payload = {
        event_name: 'Test Event',
        record_details: {
          object_type: 'contact',
          email: 'test@example.com'
        },
        properties: {
          prop_a: '',
          prop_b: '',
          prop_c: 'hello'
        }
      }

      const result = validate(payloadWithMultipleEmpty)

      expect(result.properties?.prop_a).toBe('')
      expect(result.properties?.prop_b).toBe('')
      expect(result.properties?.prop_c).toBe('hello')
    })

    it('should still coerce non-empty numeric strings to numbers', () => {
      const payloadWithNumericStrings: Payload = {
        event_name: 'Test Event',
        record_details: {
          object_type: 'contact',
          email: 'test@example.com'
        },
        properties: {
          num_str: '42',
          float_str: '3.14',
          empty_str: ''
        }
      }

      const result = validate(payloadWithNumericStrings)

      expect(result.properties?.num_str).toBe(42)
      expect(result.properties?.float_str).toBe(3.14)
      expect(result.properties?.empty_str).toBe('')
    })
  })
})
