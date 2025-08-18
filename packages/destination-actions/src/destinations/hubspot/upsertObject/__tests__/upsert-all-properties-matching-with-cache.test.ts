import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { HUBSPOT_BASE_URL } from '../../properties'
import { cache } from '../functions/cache-functions'

let testDestination = createTestIntegration(Definition)
const subscriptionMetadata = {
  // cache key for testing
  actionConfigId: 'test-cache-key'
}
const settings: Settings = {}

const payload = {
  event: 'Test Custom Object Event',
  type: 'track',
  userId: 'user_id_1',
  properties: {
    email: 'test@test.com',
    regular: {
      str_prop: 'Hello String!',
      num_prop: 123.45,
      bool_prop: true,
      numberish_string_prop: '123.45',
      boolish_string_prop: 'true',
      datetime_prop: '2024-01-08T13:52:50.212Z',
      date_prop: '2024-01-08',
      obj_prop: { key1: 'value1', key2: 'value2' },
      arr_prop: ['value1', 'value2']
    },
    sensitive: {
      str_sprop: 'Hello String!',
      num_sprop: 123.45,
      bool_sprop: true,
      numberish_string_sprop: '123.45',
      boolish_string_sprop: 'true',
      datetime_sprop: '2024-01-08T13:52:50.212Z',
      date_sprop: '2024-01-08',
      obj_sprop: { key1: 'value1', key2: 'value2' },
      arr_sprop: ['value1', 'value2']
    },
    company_id: 'company_id_1',
    deal_id: 'deal_id_1',
    deal_id_2: 'deal_id_2'
  }
} as Partial<SegmentEvent>

const mapping = {
  __segment_internal_sync_mode: 'upsert',
  object_details: {
    object_type: 'contact',
    id_field_name: 'email',
    id_field_value: { '@path': '$.properties.email' },
    property_group: 'contactinformation'
  },
  properties: { '@path': '$.properties.regular' },
  sensitive_properties: { '@path': '$.properties.sensitive' },
  association_sync_mode: 'upsert',
  associations: [],
  enable_batching: true,
  batch_size: 100
}

const propertiesResp = {
  results: [
    {
      name: 'str_prop',
      type: 'string',
      fieldType: 'text',
      hasUniqueValue: false
    },
    {
      name: 'num_prop',
      type: 'number',
      fieldType: 'number',
      hasUniqueValue: false
    },
    {
      name: 'bool_prop',
      type: 'enumeration',
      fieldType: 'booleancheckbox',
      hasUniqueValue: false
    },
    {
      name: 'numberish_string_prop',
      type: 'string',
      fieldType: 'text',
      hasUniqueValue: false
    },
    {
      name: 'boolish_string_prop',
      type: 'enumeration',
      fieldType: 'booleancheckbox',
      hasUniqueValue: false
    },
    {
      name: 'datetime_prop',
      type: 'datetime',
      fieldType: 'date',
      hasUniqueValue: false
    },
    {
      name: 'date_prop',
      type: 'date',
      fieldType: 'date',
      hasUniqueValue: false
    },
    {
      name: 'obj_prop',
      type: 'string',
      fieldType: 'text',
      hasUniqueValue: false
    },
    {
      name: 'arr_prop',
      type: 'string',
      fieldType: 'text',
      hasUniqueValue: false
    }
  ]
}

const sensitivePropertiesResp = {
  results: [
    {
      name: 'str_sprop',
      type: 'string',
      fieldType: 'text',
      hasUniqueValue: false
    },
    {
      name: 'num_sprop',
      type: 'number',
      fieldType: 'number',
      hasUniqueValue: false
    },
    {
      name: 'bool_sprop',
      type: 'enumeration',
      fieldType: 'booleancheckbox',
      hasUniqueValue: false
    },
    {
      name: 'numberish_string_sprop',
      type: 'string',
      fieldType: 'text',
      hasUniqueValue: false
    },
    {
      name: 'boolish_string_sprop',
      type: 'enumeration',
      fieldType: 'booleancheckbox',
      hasUniqueValue: false
    },
    {
      name: 'datetime_sprop',
      type: 'datetime',
      fieldType: 'date',
      hasUniqueValue: false
    },
    {
      name: 'date_sprop',
      type: 'date',
      fieldType: 'date',
      hasUniqueValue: false
    },
    {
      name: 'obj_sprop',
      type: 'string',
      fieldType: 'text',
      hasUniqueValue: false
    },
    {
      name: 'arr_sprop',
      type: 'string',
      fieldType: 'text',
      hasUniqueValue: false
    }
  ]
}

const upsertObjectReq = {
  inputs: [
    {
      idProperty: 'email',
      id: 'test@test.com',
      properties: {
        str_prop: 'Hello String!',
        num_prop: 123.45,
        bool_prop: true,
        numberish_string_prop: '123.45',
        boolish_string_prop: true,
        datetime_prop: '2024-01-08T13:52:50.212Z',
        date_prop: '2024-01-08',
        obj_prop: '{"key1":"value1","key2":"value2"}',
        arr_prop: '["value1","value2"]',
        str_sprop: 'Hello String!',
        num_sprop: 123.45,
        bool_sprop: true,
        numberish_string_sprop: '123.45',
        boolish_string_sprop: true,
        datetime_sprop: '2024-01-08T13:52:50.212Z',
        date_sprop: '2024-01-08',
        obj_sprop: '{"key1":"value1","key2":"value2"}',
        arr_sprop: '["value1","value2"]',
        email: 'test@test.com'
      }
    }
  ]
}

const upsertObjectResp = {
  results: [
    {
      id: '62102303560',
      properties: {
        email: 'test@test.com'
      }
    }
  ]
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  cache.clear()
  done()
})

describe('Hubspot.upsertObject', () => {
  describe('where syncMode = upsert', () => {
    describe('number of requests should be reduced because schema is cached', () => {
      it('should upsert a Custom Contact Record.', async () => {
        const event = createTestEvent(payload)

        nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/contact').reply(200, propertiesResp)

        nock(HUBSPOT_BASE_URL)
          .get('/crm/v3/properties/contact?dataSensitivity=sensitive')
          .reply(200, sensitivePropertiesResp)

        nock(HUBSPOT_BASE_URL)
          .post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq)
          .reply(200, upsertObjectResp)

        // First call should make requests to get property details from Hubspot, then save the schema in cache
        const responses = await testDestination.testAction('upsertObject', {
          event,
          settings,
          useDefaultMappings: true,
          mapping,
          subscriptionMetadata
        })

        nock(HUBSPOT_BASE_URL)
          .post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq)
          .reply(200, upsertObjectResp)

        // Second call should not make any requests to get property details from Hubspot
        const responses2 = await testDestination.testAction('upsertObject', {
          event,
          settings,
          useDefaultMappings: true,
          mapping,
          subscriptionMetadata
        })

        expect(responses.length).toBe(3)
        expect(responses2.length).toBe(1)
      })
    })
  })
})
