import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const settings: Settings = {}

describe('Hubspot.customEvent', () => {
  describe('will upsert new Custom Event Definition and ', () => {
    it('should then send a Custom Event Completion to Hubspot', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Custom Event 1',
        messageId: 'aaa-bbb-ccc',
        type: 'track',
        userId: 'user_id_1',
        properties: {
          custom_prop_str: 'Hello String!',
          custom_prop_number: 123.45,
          custom_prop_bool: true,
          custom_prop_numberish_string: 123.45,
          custom_prop_boolish_string: true,
          custom_prop_boolish_string_2: false,
          custom_prop_datetime: '2024-01-08T13:52:50.212Z',
          custom_prop_date: '2024-01-08',
          custom_prop_obj: {
            key1: 'value1',
            key2: 'value2'
          },
          custom_prop_arr: ['value1', 'value2']
        }
      })

      const expectedPayload = {
        eventName: 'pe23132826_custom_event_1',
        objectId: undefined,
        email: 'bibitybobity@example.com',
        utk: undefined,
        occurredAt: '2024-01-08T13:52:50.212Z',
        properties: {
          custom_prop_str: 'Hello String!',
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

      nock('https://api.hubapi.com')
        .get('/events/v3/event-definitions/custom_event_1/?includeProperties=true')
        .reply(400, {
          data: {
            status: 'error',
            message:
              'StandardError{status=error, category=VALIDATION_ERROR, message=Event with fully qualified name custom_event_1 does not exist., errors=[], context={}, links={}}',
            correlationId: '12f5b1b3-364a-4b68-9c14-5b1332d03312'
          }
        })

      nock('https://api.hubapi.com').post('/events/v3/event-definitions').reply(201, {
        match: 'full_match',
        fullyQualifiedName: 'pe23132826_custom_event_1',
        name: 'custom_event_1'
      })

      nock('https://api.hubapi.com').post('/events/v3/send', expectedPayload).reply(200, {})

      const responses = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          __segment_internal_sync_mode: 'upsert',
          event_name: { '@path': '$.event' },
          properties: { '@path': '$.properties' },
          record_details: {
            object_type: 'contact',
            email: 'bibitybobity@example.com'
          }
        }
      })

      expect(responses.length).toBe(3)
      expect(responses[2].status).toBe(200)
    })
  })
})
