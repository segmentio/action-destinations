import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { SendEventJSON, UnixTimestamp13, CreateEventJSON, EventItem } from '../types'

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
    currency: 'USD',
    some_new_str_prop: 'some_new_prop_value',
    some_new_bool_prop: true,
    some_new_number_prop: 123.45
  }
} as Partial<SegmentEvent>
const mapping = {
  uuid: { '@path': '$.messageId' },
  endUserId: { '@path': '$.properties.end_user_id' },
  anonymizeIP: true,
  eventMatching: {
    createEventIfNotFound: 'CREATE',
    shouldSnakeCaseEventKey: false,
    eventKey: { '@path': '$.event' },
    eventId: { '@path': '$.properties.event_id' }
  },
  pageUrl: { '@path': '$.context.page.url' },
  category: 'other',
  timestamp: { '@path': '$.timestamp' },
  eventType: { '@path': '$.type' },
  tags: { '@path': '$.properties.tags' },
  properties: {
    revenue: {
      '@path': '$.properties.revenue'
    },
    value: {
      '@path': '$.properties.value'
    },
    quantity: {
      '@path': '$.properties.quantity'
    },
    currency: {
      '@path': '$.properties.currency'
    },
    some_new_str_prop: {
      '@path': '$.properties.some_new_str_prop'
    },
    some_new_bool_prop: {
      '@path': '$.properties.some_new_bool_prop'
    },
    some_new_number_prop: {
      '@path': '$.properties.some_new_number_prop'
    }
  }
}

const createEventJSON: CreateEventJSON = {
  category: 'other',
  event_type: 'custom',
  key: 'Custom Event 1',
  name: 'Custom Event 1'
}

const eventItem: EventItem = {
  id: 88888888888,
  key: 'Custom Event 1',
  name: 'Custom Event 1'
}

const sendEventJSON: SendEventJSON = {
  account_id: 'testOptimizelyAccountId',
  project_id: 123456,
  anonymize_ip: true,
  client_name: 'Segment Optimizely Web Destination',
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
              value: 100,
              tags: {
                quantity: 4,
                currency: 'USD',
                $opt_event_properties: {
                  some_new_str_prop: 'some_new_prop_value',
                  some_new_bool_prop: true,
                  some_new_number_prop: 123.45
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
    it('Should fetch event_id from Optimizely then send a custom track() event to Optimizely', async () => {
      const event = createTestEvent(payload)

      nock('https://api.optimizely.com')
        .get('/v2/events?per_page=100&include_classic=false&project_id=123456')
        .reply(200, [
          { id: 99999999999, key: 'not_the_correct_key', name: 'not_the_correct_name' },
          { id: 88888888888, key: 'Custom Event 1', name: 'Custom Event 1' }
        ])

      nock('https://logx.optimizely.com')
        .post('/v1/events', sendEventJSON as unknown as any)
        .reply(204)

      const responses = await testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(2)
      expect(responses[1].status).toBe(204)
    })

    it('Should fetch event_id from Optimizely then send a custom track() event to Optimizely - event name should be snake cased and cleaned', async () => {
      const event = createTestEvent(payload)

      const mappingSnakeCase = {
        ...mapping,
        eventMatching: { ...mapping.eventMatching, shouldSnakeCaseEventKey: true }
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

      nock('https://api.optimizely.com')
        .get('/v2/events?per_page=100&include_classic=false&project_id=123456')
        .reply(200, [
          { id: 99999999999, key: 'not_the_correct_key', name: 'not_the_correct_name' },
          { id: 88888888888, key: 'custom_event_1', name: 'Custom Event 1' }
        ])

      nock('https://logx.optimizely.com')
        .post('/v1/events', sendEventJSONSnakeCase as unknown as any)
        .reply(204)

      const responses = await testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: mappingSnakeCase
      })

      expect(responses.length).toBe(2)
      expect(responses[1].status).toBe(204)
    })
  })
  describe('Event Schema does not exist in Optimizely', () => {
    it('Should fail to fetch event_id from Optimizely, then create new Custom Event schema in Optimizely, then send a custom track() event to Optimizely', async () => {
      const event = createTestEvent(payload)

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
      expect(responses[2].status).toBe(204)
    })
  })
})
