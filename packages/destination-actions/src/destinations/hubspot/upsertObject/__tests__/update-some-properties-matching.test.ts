import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { HUBSPOT_BASE_URL } from '../../properties'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {}

const payload = {
  event: 'Test Custom Object Event',
  type: 'track',
  userId: 'test-user-id',
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
  __segment_internal_sync_mode: 'update',
  object_details: {
    object_type: 'contact',
    id_field_name: 'contact_id',
    id_field_value: { '@path': '$.userId' },
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
    // Missing properties are commented out
    // {
    //   name: 'str_prop',
    //   type: 'string',
    //   fieldType: 'text',
    //   hasUniqueValue: false
    // },
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
    // {
    //   name: 'numberish_string_prop',
    //   type: 'number',
    //   fieldType: 'number',
    //   hasUniqueValue: false
    // },
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
    // {
    //   name: 'bool_sprop',
    //   type: 'enumeration',
    //   fieldType: 'booleancheckbox',
    //   hasUniqueValue: false
    // },
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

const readObjectReq = {
  properties: ['contact_id'],
  idProperty: 'contact_id',
  inputs: [
    {
      id: 'test-user-id'
    }
  ]
}

const readObjectResp = {
  results: [
    {
      id: '57865728900',
      properties: {
        contact_id: 'test-user-id',
        hs_object_id: '57865728900'
      }
    }
  ]
}

const createPropertiesReq = {
  inputs: [
    {
      name: 'str_prop',
      label: 'str_prop',
      groupName: 'contactinformation',
      type: 'string',
      fieldType: 'text'
    },
    {
      name: 'numberish_string_prop',
      label: 'numberish_string_prop',
      groupName: 'contactinformation',
      type: 'string',
      fieldType: 'text'
    },
    {
      name: 'bool_sprop',
      label: 'bool_sprop',
      groupName: 'contactinformation',
      type: 'enumeration',
      dataSensitivity: 'sensitive',
      fieldType: 'booleancheckbox',
      options: [
        {
          label: 'true',
          value: 'true',
          hidden: false,
          description: 'True',
          displayOrder: 1
        },
        {
          label: 'false',
          value: 'false',
          hidden: false,
          description: 'False',
          displayOrder: 2
        }
      ]
    }
  ]
}

const updateContactReq = {
  inputs: [
    {
      idProperty: 'contact_id',
      id: 'test-user-id',
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
        arr_sprop: '["value1","value2"]'
      }
    }
  ]
}

const updateContactResp = {
  results: [
    {
      id: '57865728900',
      properties: {
        str_prop: 'Hello String!',
        numberish_string_prop: '123.45',
        bool_sprop: true,
        hs_object_id: '57865728900'
      }
    }
  ]
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Hubspot.upsertObject', () => {
  describe('where syncMode = update', () => {
    describe('Some properties match on Hubspot object schema', () => {
      it('should create 2 missing properties and 1 missing sensitive property on Hubspot schema, then upsert a Custom Contact Record.', async () => {
        const event = createTestEvent(payload)

        nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/contact').reply(200, propertiesResp)

        nock(HUBSPOT_BASE_URL)
          .get('/crm/v3/properties/contact?dataSensitivity=sensitive')
          .reply(200, sensitivePropertiesResp)

        nock(HUBSPOT_BASE_URL).post('/crm/v3/properties/contact/batch/create', createPropertiesReq).reply(200)

        nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/read', readObjectReq).reply(200, readObjectResp)

        nock(HUBSPOT_BASE_URL)
          .post('/crm/v3/objects/contact/batch/update', updateContactReq)
          .reply(200, updateContactResp)

        const responses = await testDestination.testAction('upsertObject', {
          event,
          settings,
          useDefaultMappings: true,
          mapping
        })

        expect(responses.length).toBe(5)
      })
    })
  })
})
