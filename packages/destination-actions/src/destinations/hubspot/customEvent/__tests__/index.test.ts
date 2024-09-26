import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, IntegrationError } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { cache } from '../functions/cache-functions'

let testDestination = createTestIntegration(Definition)
const subscriptionMetadata = {
  // cache key for testing
  actionConfigId: 'test-cache-key'
}
const timestamp = '2024-01-08T13:52:50.212Z'
const settings: Settings = {}
const validPayload = {
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
} as Partial<SegmentEvent>
const upsertMapping = {
  __segment_internal_sync_mode: 'upsert',
  event_name: { '@path': '$.event' },
  properties: { '@path': '$.properties' },
  record_details: {
    object_type: 'contact',
    email: 'bibitybobity@example.com'
  }
}
const expectedHubspotAPIPayload = {
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

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  cache.clear()
  done()
})

describe('Hubspot.customEvent', () => {
  describe('where syncMode = upsert', () => {
    it('should use cache to reduce number of requests to Hubspot (when 2 events with same schema fired).', async () => {
      const event = createTestEvent(validPayload)

      // fetches the event definition from Hubspot
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

      // creates an event definition on Hubspot
      nock('https://api.hubapi.com').post('/events/v3/event-definitions').reply(201, {
        fullyQualifiedName: 'pe23132826_custom_event_1',
        name: 'custom_event_1'
      })

      // sends an event completion to Hubspot
      nock('https://api.hubapi.com').post('/events/v3/send', expectedHubspotAPIPayload).reply(200, {})

      const responses = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: upsertMapping,
        subscriptionMetadata
      })

      // sends an event completion to Hubspot without first fetching the event definition
      nock('https://api.hubapi.com').post('/events/v3/send', expectedHubspotAPIPayload).reply(200, {})

      const responses2 = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: upsertMapping,
        subscriptionMetadata
      })

      expect(responses.length).toBe(3)
      expect(responses[2].status).toBe(200)
      expect(responses2.length).toBe(1)
      expect(responses2[0].status).toBe(200)
    })

    it('should send a Custom Event Completion to Hubspot when the event definition does not exist', async () => {
      const event = createTestEvent(validPayload)

      // fetches the event definition from Hubspot
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

      // creates an event definition on Hubspot
      nock('https://api.hubapi.com').post('/events/v3/event-definitions').reply(201, {
        fullyQualifiedName: 'pe23132826_custom_event_1',
        name: 'custom_event_1'
      })

      // sends an event completion to Hubspot
      nock('https://api.hubapi.com').post('/events/v3/send', expectedHubspotAPIPayload).reply(200, {})

      const responses = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: upsertMapping,
        subscriptionMetadata
      })

      expect(responses.length).toBe(3)
      expect(responses[2].status).toBe(200)
    })

    it('should send a Custom Event Completion to Hubspot when the event definition does exist and is a full match', async () => {
      const event = createTestEvent(validPayload)

      // fetches the event definition from Hubspot
      nock('https://api.hubapi.com')
        .get('/events/v3/event-definitions/custom_event_1/?includeProperties=true')
        .reply(200, {
          name: 'custom_event_1',
          fullyQualifiedName: 'pe23132826_custom_event_1',
          properties: [
            {
              name: 'custom_prop_boolish_string',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_obj',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_arr',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_boolish_string_2',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_date',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_bool',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_str',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_datetime',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_numberish_string',
              type: 'number',
              archived: false
            },
            {
              name: 'custom_prop_number',
              type: 'number',
              archived: false
            }
          ]
        })

      // sends an event completion to Hubspot
      nock('https://api.hubapi.com').post('/events/v3/send', expectedHubspotAPIPayload).reply(200, {})

      const responses = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: upsertMapping,
        subscriptionMetadata
      })

      expect(responses.length).toBe(2)
      expect(responses[1].status).toBe(200)
    })

    it('should send a Custom Event Completion to Hubspot when the event definition does exists but is a partial match', async () => {
      const event = createTestEvent(validPayload)

      // fetches the event definition from Hubspot
      nock('https://api.hubapi.com')
        .get('/events/v3/event-definitions/custom_event_1/?includeProperties=true')
        .reply(200, {
          name: 'custom_event_1',
          fullyQualifiedName: 'pe23132826_custom_event_1',
          properties: [
            // deliberately leaving out this boolean / enumeration property so that it will be created in the defintion
            // {
            //     name: "custom_prop_boolish_string",
            //     type: "enumeration",
            //     archived: false
            // },
            {
              name: 'custom_prop_obj',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_arr',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_boolish_string_2',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_date',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_bool',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_str',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_datetime',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_numberish_string',
              type: 'number',
              archived: false
            },
            {
              name: 'custom_prop_number',
              type: 'number',
              archived: false
            }
          ]
        })

      const expectedHubspotCreatePropertyPayload = {
        name: 'custom_prop_boolish_string',
        label: 'custom_prop_boolish_string',
        type: 'enumeration',
        description: 'custom_prop_boolish_string - (created by Segment)',
        options: [
          {
            label: 'true',
            value: true,
            hidden: false,
            description: 'True',
            displayOrder: 1
          },
          {
            label: 'false',
            value: false,
            hidden: false,
            description: 'False',
            displayOrder: 2
          }
        ]
      }

      nock('https://api.hubapi.com')
        .post('/events/v3/event-definitions/pe23132826_custom_event_1/property', expectedHubspotCreatePropertyPayload)
        .reply(200, {})

      // sends an event completion to Hubspot
      nock('https://api.hubapi.com').post('/events/v3/send', expectedHubspotAPIPayload).reply(200, {})

      const responses = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: upsertMapping,
        subscriptionMetadata
      })

      expect(responses.length).toBe(3)
      expect(responses[2].status).toBe(200)
    })
  })

  describe('where syncMode = update', () => {
    it('should not send a Custom Event Completion to Hubspot when the event definition does not exist', async () => {
      const event = createTestEvent(validPayload)

      // fetches the event definition from Hubspot
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

      const updateMapping = {
        ...upsertMapping,
        __segment_internal_sync_mode: 'update'
      }

      await expect(
        testDestination.testAction('customEvent', {
          event,
          settings,
          useDefaultMappings: true,
          mapping: updateMapping,
          subscriptionMetadata
        })
      ).rejects.toThrowError(
        new IntegrationError(
          "The 'Sync Mode' setting is set to 'update' which is stopping Segment from creating a new Custom Event Schema in the HubSpot",
          'HUBSPOT_SCHEMA_MISSING',
          400
        )
      )
    })

    it('should send a Custom Event Completion to Hubspot when the event definition does exist and is a full match', async () => {
      const event = createTestEvent(validPayload)

      // fetches the event definition from Hubspot
      nock('https://api.hubapi.com')
        .get('/events/v3/event-definitions/custom_event_1/?includeProperties=true')
        .reply(200, {
          name: 'custom_event_1',
          fullyQualifiedName: 'pe23132826_custom_event_1',
          properties: [
            {
              name: 'custom_prop_boolish_string',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_obj',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_arr',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_boolish_string_2',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_date',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_bool',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_str',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_datetime',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_numberish_string',
              type: 'number',
              archived: false
            },
            {
              name: 'custom_prop_number',
              type: 'number',
              archived: false
            }
          ]
        })

      // sends an event completion to Hubspot
      nock('https://api.hubapi.com').post('/events/v3/send', expectedHubspotAPIPayload).reply(200, {})

      const updateMapping = {
        ...upsertMapping,
        __segment_internal_sync_mode: 'update'
      }

      const responses = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: updateMapping,
        subscriptionMetadata
      })

      expect(responses.length).toBe(2)
      expect(responses[1].status).toBe(200)
    })

    it('should send a Custom Event Completion to Hubspot when the event definition does exists but is a partial match', async () => {
      const event = createTestEvent(validPayload)

      // fetches the event definition from Hubspot
      nock('https://api.hubapi.com')
        .get('/events/v3/event-definitions/custom_event_1/?includeProperties=true')
        .reply(200, {
          name: 'custom_event_1',
          fullyQualifiedName: 'pe23132826_custom_event_1',
          properties: [
            // deliberately leaving out this boolean / enumeration property so that it will be created in the defintion
            // {
            //     name: "custom_prop_boolish_string",
            //     type: "enumeration",
            //     archived: false
            // },
            {
              name: 'custom_prop_obj',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_arr',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_boolish_string_2',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_date',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_bool',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_str',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_datetime',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_numberish_string',
              type: 'number',
              archived: false
            },
            {
              name: 'custom_prop_number',
              type: 'number',
              archived: false
            }
          ]
        })

      const expectedHubspotCreatePropertyPayload = {
        name: 'custom_prop_boolish_string',
        label: 'custom_prop_boolish_string',
        type: 'enumeration',
        description: 'custom_prop_boolish_string - (created by Segment)',
        options: [
          {
            label: 'true',
            value: true,
            hidden: false,
            description: 'True',
            displayOrder: 1
          },
          {
            label: 'false',
            value: false,
            hidden: false,
            description: 'False',
            displayOrder: 2
          }
        ]
      }

      nock('https://api.hubapi.com')
        .post('/events/v3/event-definitions/pe23132826_custom_event_1/property', expectedHubspotCreatePropertyPayload)
        .reply(200, {})

      // sends an event completion to Hubspot
      nock('https://api.hubapi.com').post('/events/v3/send', expectedHubspotAPIPayload).reply(200, {})

      const updateMapping = {
        ...upsertMapping,
        __segment_internal_sync_mode: 'update'
      }

      const responses = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: updateMapping,
        subscriptionMetadata
      })

      expect(responses.length).toBe(3)
      expect(responses[2].status).toBe(200)
    })
  })

  describe('where syncMode = add', () => {
    it('should send a Custom Event Completion to Hubspot when the event definition does not exist', async () => {
      const event = createTestEvent(validPayload)

      // fetches the event definition from Hubspot
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

      // creates an event definition on Hubspot
      nock('https://api.hubapi.com').post('/events/v3/event-definitions').reply(201, {
        fullyQualifiedName: 'pe23132826_custom_event_1',
        name: 'custom_event_1'
      })

      // sends an event completion to Hubspot
      nock('https://api.hubapi.com').post('/events/v3/send', expectedHubspotAPIPayload).reply(200, {})

      const addMapping = {
        ...upsertMapping,
        __segment_internal_sync_mode: 'add'
      }

      const responses = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: addMapping,
        subscriptionMetadata
      })

      expect(responses.length).toBe(3)
      expect(responses[2].status).toBe(200)
    })

    it('should send a Custom Event Completion to Hubspot when the event definition does exist and is a full match', async () => {
      const event = createTestEvent(validPayload)

      // fetches the event definition from Hubspot
      nock('https://api.hubapi.com')
        .get('/events/v3/event-definitions/custom_event_1/?includeProperties=true')
        .reply(200, {
          name: 'custom_event_1',
          fullyQualifiedName: 'pe23132826_custom_event_1',
          properties: [
            {
              name: 'custom_prop_boolish_string',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_obj',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_arr',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_boolish_string_2',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_date',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_bool',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_str',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_datetime',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_numberish_string',
              type: 'number',
              archived: false
            },
            {
              name: 'custom_prop_number',
              type: 'number',
              archived: false
            }
          ]
        })

      // sends an event completion to Hubspot
      nock('https://api.hubapi.com').post('/events/v3/send', expectedHubspotAPIPayload).reply(200, {})

      const addMapping = {
        ...upsertMapping,
        __segment_internal_sync_mode: 'add'
      }

      const responses = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: addMapping,
        subscriptionMetadata
      })

      expect(responses.length).toBe(2)
      expect(responses[1].status).toBe(200)
    })

    it('should not send a Custom Event Completion to Hubspot when the event definition does exists but is a partial match', async () => {
      const event = createTestEvent(validPayload)

      // fetches the event definition from Hubspot
      nock('https://api.hubapi.com')
        .get('/events/v3/event-definitions/custom_event_1/?includeProperties=true')
        .reply(200, {
          name: 'custom_event_1',
          fullyQualifiedName: 'pe23132826_custom_event_1',
          properties: [
            // deliberately leaving out this boolean / enumeration property so that it will be created in the defintion
            // {
            //     name: "custom_prop_boolish_string",
            //     type: "enumeration",
            //     archived: false
            // },
            {
              name: 'custom_prop_obj',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_arr',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_boolish_string_2',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_date',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_bool',
              type: 'enumeration',
              archived: false
            },
            {
              name: 'custom_prop_str',
              type: 'string',
              archived: false
            },
            {
              name: 'custom_prop_datetime',
              type: 'datetime',
              archived: false
            },
            {
              name: 'custom_prop_numberish_string',
              type: 'number',
              archived: false
            },
            {
              name: 'custom_prop_number',
              type: 'number',
              archived: false
            }
          ]
        })

      const expectedHubspotCreatePropertyPayload = {
        name: 'custom_prop_boolish_string',
        label: 'custom_prop_boolish_string',
        type: 'enumeration',
        description: 'custom_prop_boolish_string - (created by Segment)',
        options: [
          {
            label: 'true',
            value: true,
            hidden: false,
            description: 'True',
            displayOrder: 1
          },
          {
            label: 'false',
            value: false,
            hidden: false,
            description: 'False',
            displayOrder: 2
          }
        ]
      }

      nock('https://api.hubapi.com')
        .post('/events/v3/event-definitions/pe23132826_custom_event_1/property', expectedHubspotCreatePropertyPayload)
        .reply(200, {})

      // sends an event completion to Hubspot
      nock('https://api.hubapi.com').post('/events/v3/send', expectedHubspotAPIPayload).reply(200, {})

      const addMapping = {
        ...upsertMapping,
        __segment_internal_sync_mode: 'add'
      }

      await expect(
        testDestination.testAction('customEvent', {
          event,
          settings,
          useDefaultMappings: true,
          mapping: addMapping,
          subscriptionMetadata
        })
      ).rejects.toThrowError(
        new IntegrationError(
          "The 'Sync Mode' setting is set to 'add' which is stopping Segment from creating a new properties on the Event Schema in the HubSpot",
          'HUBSPOT_SCHEMA_MISSING',
          400
        )
      )
    })
  })
})
