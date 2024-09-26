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
    company_id: 'company_id_1'
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
      type: 'number',
      fieldType: 'number',
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
      type: 'number',
      fieldType: 'number',
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

const upsertRecordReq = {
  inputs: [
    {
      idProperty: 'email',
      id: 'test@test.com',
      properties: {
        str_prop: 'Hello String!',
        num_prop: 123.45,
        bool_prop: true,
        numberish_string_prop: 123.45,
        boolish_string_prop: true,
        datetime_prop: '2024-01-08T13:52:50.212Z',
        date_prop: '2024-01-08',
        obj_prop: '{"key1":"value1","key2":"value2"}',
        arr_prop: '["value1","value2"]',
        str_sprop: 'Hello String!',
        num_sprop: 123.45,
        bool_sprop: true,
        numberish_string_sprop: 123.45,
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

const upsertRecordResp = {
  results: [
    {
      id: '62102303560',
      properties: {
        email: 'test@test.com'
      }
    }
  ]
}

const upsertAssocRecordReq = {
  inputs: [
    {
      idProperty: 'kompany',
      id: 'company_id_1',
      properties: {
        kompany: 'company_id_1'
      }
    }
  ]
}

const upsertAssocRecordResp = {
  results: [
    {
      id: '798758764867',
      properties: {
        kompany: 'company_id_1'
      }
    }
  ]
}

const upsertAssociationReq = {
  inputs: [
    {
      types: [
        {
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: '1'
        }
      ],
      from: {
        id: '62102303560'
      },
      to: {
        id: '798758764867'
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
  describe('where syncMode = upsert and where the Hubspot Schema is already a full match', () => {
    it('should upsert a Custom Contact Record.', async () => {
      const event = createTestEvent(payload)

      nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/contact').reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact?dataSensitivity=sensitive')
        .reply(200, sensitivePropertiesResp)

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/upsert', upsertRecordReq).reply(200, upsertRecordResp)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(3)
      expect(responses[2].status).toBe(200)
    })

    it('should upsert a Custom Contact Record then upsert an Associated Company Record and then create an Association', async () => {
      const event = createTestEvent(payload)

      nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/contact').reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact?dataSensitivity=sensitive')
        .reply(200, sensitivePropertiesResp)

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/upsert', upsertRecordReq).reply(200, upsertRecordResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/upsert', upsertAssocRecordReq)
        .reply(200, upsertAssocRecordResp)

      nock(HUBSPOT_BASE_URL).post('/crm/v4/associations/contact/company/batch/create', upsertAssociationReq).reply(200)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          ...mapping,
          associations: [
            {
              object_type: 'company',
              association_label: 'HUBSPOT_DEFINED:1',
              id_field_name: 'kompany',
              id_field_value: { '@path': '$.properties.company_id' }
            }
          ]
        }
      })

      expect(responses.length).toBe(5)
      expect(responses[4].status).toBe(200)
    })
  })
})
