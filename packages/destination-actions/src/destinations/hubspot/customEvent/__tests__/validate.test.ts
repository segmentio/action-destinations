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
    custom_prop_arr: ['value1', 'value2'],
    custom_prop_phone: '+61400000000'
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
    custom_prop_arr: '["value1","value2"]',
    custom_prop_phone: '+61400000000'
  }
}

describe('Hubspot.customEvent', () => {
  it('validate function should ensure no leading or trailing spaces in properties sent to Hubspot', async () => {
    const validatedPayload = validate(payload)
    expect(validatedPayload).toEqual(expectedValidatedPayload)
  })

  describe('empty string to number instrumentation', () => {
    const statsClient = {
      incr: jest.fn(),
      observe: jest.fn(),
      _name: jest.fn(),
      _tags: jest.fn(),
      set: jest.fn(),
      histogram: jest.fn()
    }

    const statsContext = {
      statsClient,
      tags: ['test:tag']
    }

    const logger = {
      level: 'warn',
      name: 'test-logger',
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      crit: jest.fn(),
      log: jest.fn(),
      withTags: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    const subscriptionMetadata = {
      destinationConfigId: 'dest-123',
      sourceId: 'src-456'
    }

    it('should emit a metric and log when an empty string is coerced to a number', () => {
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

      validate(payloadWithEmptyString, statsContext, logger, subscriptionMetadata)

      expect(statsClient.incr).toHaveBeenCalledWith('hubspot.custom_event.empty_string_to_number', 1, statsContext.tags)
      expect(logger.warn).toHaveBeenCalledWith(
        'hubspot.custom_event.empty_string_to_number destinationConfigId: dest-123 sourceId: src-456'
      )
    })

    it('should emit only once even when multiple properties are empty strings', () => {
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

      validate(payloadWithMultipleEmpty, statsContext, logger, subscriptionMetadata)

      expect(statsClient.incr).toHaveBeenCalledTimes(1)
      expect(logger.warn).toHaveBeenCalledTimes(1)
    })

    it('should not emit a metric for non-empty string values', () => {
      const payloadWithNormalValues: Payload = {
        event_name: 'Test Event',
        record_details: {
          object_type: 'contact',
          email: 'test@example.com'
        },
        properties: {
          str_prop: 'hello',
          num_prop: 42,
          bool_prop: true
        }
      }

      validate(payloadWithNormalValues, statsContext, logger, subscriptionMetadata)

      expect(statsClient.incr).not.toHaveBeenCalledWith(
        'hubspot.custom_event.empty_string_to_number',
        expect.anything(),
        expect.anything()
      )
      expect(logger.warn).not.toHaveBeenCalled()
    })
  })
})
