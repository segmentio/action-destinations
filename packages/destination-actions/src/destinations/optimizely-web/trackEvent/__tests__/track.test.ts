import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, PayloadValidationError } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { SendEventJSON, UnixTimestamp13, CreateEventJSON, EventItemWithProps } from '../types'

let testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const settings: Settings = {
  optimizelyApiKey: 'testOptimizelyApiKey',
  optimizelyAccountId: 'testOptimizelyAccountId',
  projectID: 123456
}
const payload = {
  timestamp: timestamp,
  event: 'Custom Event 1',
  messageId: 'aaa-bbb-ccc',
  type: 'track',
  userId: 'user_id_1',
  properties: {
    end_user_id: 'end_user_id_1',
    tags: {
      tag1: 'tagvalue1',
      tag2: 'tagvalue2'
    },
    revenue: 10000,
    value: 100,
    quantity: 4,
    some_new_str_prop: 'some_new_prop_value',
    some_new_bool_prop: true,
    some_new_num_prop: 123.45
  }
} as Partial<SegmentEvent>
const mapping = {
  uuid: { '@path': '$.messageId' },
  endUserId: { '@path': '$.properties.end_user_id' },
  anonymizeIP: true,
  eventSyncConfig: {
    createEventIfNotFound: 'CREATE',
    shouldSnakeCaseEventKey: false,
    eventKey: { '@path': '$.event' },
    eventId: { '@path': '$.properties.event_id' }
  },
  category: 'other',
  timestamp: { '@path': '$.timestamp' },
  tags: { '@path': '$.properties.tags' },
  standardEventProperties: {
    revenue: {
      '@path': '$.properties.revenue'
    },
    value: {
      '@path': '$.properties.value'
    },
    quantity: {
      '@path': '$.properties.quantity'
    }
  },
  customStringProperties: {
    str_prop: {
      '@path': '$.properties.some_new_str_prop'
    }
  },
  customBooleanProperties: {
    bool_prop: {
      '@path': '$.properties.some_new_bool_prop'
    }
  },
  customNumericProperties: {
    num_prop: {
      '@path': '$.properties.some_new_num_prop'
    }
  }
}

const sendEventJSON: SendEventJSON = {
  account_id: 'testOptimizelyAccountId',
  project_id: 123456,
  anonymize_ip: true,
  client_name: 'twilio_segment/optimizely_web_destination',
  client_version: '1.0.0',
  enrich_decisions: true,
  visitors: [
    {
      visitor_id: 'end_user_id_1',
      attributes: [],
      snapshots: [
        {
          decisions: [],
          events: [
            {
              entity_id: '88888888888',
              key: 'Custom Event 1',
              timestamp: 1704721970212 as UnixTimestamp13,
              uuid: 'aaa-bbb-ccc',
              type: 'other',
              revenue: 1000000,
              quantity: 4,
              value: 100,
              tags: {
                $opt_event_properties: {
                  str_prop: 'some_new_prop_value',
                  bool_prop: true,
                  num_prop: 123.45
                },
                tag1: 'tagvalue1',
                tag2: 'tagvalue2'
              }
            }
          ]
        }
      ]
    }
  ]
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('OptimizelyWeb.trackEvent', () => {
  describe('Event Schema already defined in Optimizely', () => {
    it('Should fetch event_id from Optimizely, then compare properties, then send a custom track() event to Optimizely', async () => {
      const event = createTestEvent(payload)

      const eventSearchRESP = [
        { id: 99999999999, key: 'not_the_correct_key', name: 'not_the_correct_name' },
        { id: 88888888888, key: 'Custom Event 1', name: 'Custom Event 1' }
      ]

      const propSearchRESP = {
        event_properties: [
          {
            data_type: 'number',
            name: 'revenue'
          },
          {
            data_type: 'number',
            name: 'quantity'
          },
          {
            data_type: 'number',
            name: 'value'
          },
          {
            data_type: 'string',
            name: 'str_prop'
          },
          {
            data_type: 'boolean',
            name: 'bool_prop'
          },
          {
            data_type: 'number',
            name: 'num_prop'
          }
        ],
        id: 88888888888,
        key: 'Custom Event 1',
        name: 'Custom Event 1'
      }

      nock('https://api.optimizely.com')
        .get('/v2/events?per_page=100&include_classic=false&project_id=123456')
        .reply(200, eventSearchRESP)

      nock('https://api.optimizely.com').get('/v2/events/88888888888?include_classic=false').reply(200, propSearchRESP)

      nock('https://logx.optimizely.com')
        .post('/v1/events', sendEventJSON as unknown as any)
        .reply(204)

      const responses = await testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(3)
      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[2].status).toBe(204)
    })

    it('Should fetch event_id from Optimizely, then compare properties, then send a custom track() event to Optimizely - event name should be snake cased and cleaned', async () => {
      const event = createTestEvent(payload)

      const mappingSnakeCase = {
        ...mapping,
        eventSyncConfig: { ...mapping.eventSyncConfig, shouldSnakeCaseEventKey: true }
      }

      const sendEventJSONSnakeCase = {
        ...sendEventJSON,
        visitors: [
          {
            ...sendEventJSON.visitors[0],
            snapshots: [
              {
                ...sendEventJSON.visitors[0].snapshots[0],
                events: [
                  {
                    ...sendEventJSON.visitors[0].snapshots[0].events[0],
                    key: 'custom_event_1'
                  }
                ]
              }
            ]
          }
        ]
      }

      const eventSearchRESP = [
        { id: 99999999999, key: 'not_the_correct_key', name: 'not_the_correct_name' },
        { id: 88888888888, key: 'custom_event_1', name: 'Custom Event 1' }
      ]

      const propSearchRESP = {
        event_properties: [
          {
            data_type: 'number',
            name: 'revenue'
          },
          {
            data_type: 'number',
            name: 'quantity'
          },
          {
            data_type: 'number',
            name: 'value'
          },
          {
            data_type: 'string',
            name: 'str_prop'
          },
          {
            data_type: 'boolean',
            name: 'bool_prop'
          },
          {
            data_type: 'number',
            name: 'num_prop'
          }
        ],
        id: 88888888888,
        key: 'custom_event_1',
        name: 'Custom Event 1'
      }

      nock('https://api.optimizely.com')
        .get('/v2/events?per_page=100&include_classic=false&project_id=123456')
        .reply(200, eventSearchRESP)

      nock('https://api.optimizely.com').get('/v2/events/88888888888?include_classic=false').reply(200, propSearchRESP)

      nock('https://logx.optimizely.com')
        .post('/v1/events', sendEventJSONSnakeCase as unknown as any)
        .reply(204)

      const responses = await testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: mappingSnakeCase
      })

      expect(responses.length).toBe(3)
      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[2].status).toBe(204)
    })
  })
  describe('Event Schema does not exist in Optimizely', () => {
    it('Should fail to fetch event_id from Optimizely, then create new Custom Event schema in Optimizely, then send a custom track() event to Optimizely', async () => {
      const event = createTestEvent(payload)

      const createEventJSON: CreateEventJSON = {
        category: 'other',
        event_type: 'custom',
        key: 'Custom Event 1',
        name: 'Custom Event 1',
        event_properties: [
          {
            data_type: 'string',
            name: 'str_prop'
          },
          {
            data_type: 'number',
            name: 'num_prop'
          },
          {
            data_type: 'boolean',
            name: 'bool_prop'
          }
        ]
      }

      const eventItem: EventItemWithProps = {
        id: 88888888888,
        key: 'Custom Event 1',
        name: 'Custom Event 1',
        event_properties: [
          {
            data_type: 'string',
            name: 'str_prop'
          },
          {
            data_type: 'number',
            name: 'num_prop'
          },
          {
            data_type: 'boolean',
            name: 'bool_prop'
          }
        ]
      }

      nock('https://api.optimizely.com')
        .get('/v2/events?per_page=100&include_classic=false&project_id=123456')
        .reply(200, [{ id: 99999999999, key: 'not_the_correct_key', name: 'not_the_correct_name' }])

      nock('https://api.optimizely.com')
        .post('/v2/projects/123456/custom_events', createEventJSON as unknown as any)
        .reply(200, eventItem)

      nock('https://logx.optimizely.com')
        .post('/v1/events', sendEventJSON as unknown as any)
        .reply(204)

      const responses = await testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(3)
      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[2].status).toBe(204)
    })
  })

  describe('Event Schema exists but there is a property mismatch', () => {
    it('Should fetch event_id from Optimizely, then detect property mistmatch, then throw error', async () => {
      const event = createTestEvent(payload)

      const eventSearchRESP = [
        { id: 99999999999, key: 'not_the_correct_key', name: 'not_the_correct_name' },
        { id: 88888888888, key: 'Custom Event 1', name: 'Custom Event 1' }
      ]

      const propSearchRESP = {
        event_properties: [
          {
            data_type: 'number',
            name: 'revenue'
          },
          {
            data_type: 'number',
            name: 'quantity'
          },
          {
            data_type: 'number',
            name: 'value'
          },
          {
            data_type: 'string',
            name: 'str_prop'
          },
          {
            data_type: 'boolean',
            name: 'bool_prop'
          }
        ],
        id: 88888888888,
        key: 'Custom Event 1',
        name: 'Custom Event 1'
      }

      nock('https://api.optimizely.com')
        .get('/v2/events?per_page=100&include_classic=false&project_id=123456')
        .reply(200, eventSearchRESP)

      nock('https://api.optimizely.com').get('/v2/events/88888888888?include_classic=false').reply(200, propSearchRESP)

      await expect(
        testDestination.testAction('trackEvent', {
          event,
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrowError(
        new PayloadValidationError(
          `Property: 'num_prop' is not defined in Optimizely event with event_id: '88888888888'. Please define the property in Optimizely or remove it from the event.`
        )
      )
    })
  })
})
