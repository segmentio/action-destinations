import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, JSONObject } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { HUBSPOT_BASE_URL } from '../../properties'
import { schemaCache, listCache } from '../functions/cache-functions'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {}

const payload = {
  event: 'Test Custom Object Event',
  type: 'track',
  userId: 'user_id_1',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'contact_list_2',
    }
  },
  properties: {
    contact_list_2: true,
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
  batch_size: 100,
  batch_keys:['list_details'],
  traits_or_props: { '@path': '$.properties' },
  computation_key: { '@path': '$.context.personas.computation_key' },
  computation_class: { '@path': '$.context.personas.computation_class'},
  list_details: {
    connected_to_engage_audience: true,
    should_create_list: true
  }
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
  schemaCache.clear()
  listCache.clear()
  done()
})

describe('Hubspot.upsertObject', () => {
  describe('Engage Audience', () => {
    it('should add a user to an existing Hubspot List.', async () => {
      const event = createTestEvent(payload)

      nock(HUBSPOT_BASE_URL)
        .get(`/crm/v3/lists/object-type-id/contact/name/contact_list_2`)
        .reply(200, {
          list: {
            listId: '21',
            processingType: 'MANUAL',
            objectTypeId: '0-2',
            name: 'contact_list_2'
          }
        })

      nock(HUBSPOT_BASE_URL)
        .put(`/crm/v3/lists/21/memberships/add-and-remove`, {
          recordIdsToAdd: ['62102303560'],
          recordIdsToRemove: []
        })
        .reply(200)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact')
        .reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact?dataSensitivity=sensitive')
        .reply(200, sensitivePropertiesResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq)
        .reply(200, upsertObjectResp)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(5)
    })

    it('should remove a user from an existing Hubspot List.', async () => {
      const modifiedPayload = { ...payload, properties: { ...payload.properties, contact_list_2: false } }
    
      const event = createTestEvent(modifiedPayload)

      nock(HUBSPOT_BASE_URL)
        .get(`/crm/v3/lists/object-type-id/contact/name/contact_list_2`)
        .reply(200, {
          list: {
            listId: '21',
            processingType: 'MANUAL',
            objectTypeId: '0-2',
            name: 'contact_list_2'
          }
        })

      nock(HUBSPOT_BASE_URL)
        .put(`/crm/v3/lists/21/memberships/add-and-remove`, {
          recordIdsToAdd: [],
          recordIdsToRemove: ['62102303560']
        })
        .reply(200)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact')
        .reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact?dataSensitivity=sensitive')
        .reply(200, sensitivePropertiesResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq)
        .reply(200, upsertObjectResp)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(5)
    })

    it('should add a user to an non existing Hubspot List - by creating the List first.', async () => {
      const event = createTestEvent(payload)

      nock(HUBSPOT_BASE_URL)
        .get(`/crm/v3/lists/object-type-id/contact/name/contact_list_2`)
        .reply(400, {
          status: 'error',
          message: 'List does not exist with name contact_list_2 and object type ID 0-2.'
        })

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/lists', {name: "contact_list_2", objectTypeId: "contact", processingType: "MANUAL"})
        .reply(200, {
          list: {
            listId: "21",
            objectTypeId: "0-2",
            name: "contact_list_2"
          }
        })

      nock(HUBSPOT_BASE_URL)
        .put(`/crm/v3/lists/21/memberships/add-and-remove`, {
          recordIdsToAdd: ['62102303560'],
          recordIdsToRemove: []
        })
        .reply(200)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact')
        .reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact?dataSensitivity=sensitive')
        .reply(200, sensitivePropertiesResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq)
        .reply(200, upsertObjectResp)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(6)
    })

    it('should not create a List if it is in the LRU Cache.', async () => {
      const subscriptionMetadata = {
        // cache key for testing
        actionConfigId: 'test-cache-key'
      }
      
      // To simplify this test properties and sensitive_properties are excluded
      const modifiedPayload = { 
        ...payload, 
        properties: {    
          contact_list_2: true,
          email: 'test@test.com'
        }
      } as Partial<SegmentEvent>

      nock(HUBSPOT_BASE_URL)
        .get(`/crm/v3/lists/object-type-id/contact/name/contact_list_2`)
        .reply(200, {
          list: {
            listId: '21',
            processingType: 'MANUAL',
            objectTypeId: '0-2',
            name: 'contact_list_2'
          }
        })

      nock(HUBSPOT_BASE_URL)
        .put(`/crm/v3/lists/21/memberships/add-and-remove`, {
          recordIdsToAdd: ['62102303560'],
          recordIdsToRemove: []
        })
        .reply(200)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert',
          {inputs:[{idProperty:"email",id:"test@test.com",properties:{email:"test@test.com"}}]})
        .reply(200, upsertObjectResp)

      const responses = await testDestination.testAction('upsertObject', {
        event: modifiedPayload,
        settings,
        useDefaultMappings: true,
        mapping,
        features: { 'actions-hubspot-lists-association-support': true },
        subscriptionMetadata
      })

      nock(HUBSPOT_BASE_URL)
        .put(`/crm/v3/lists/21/memberships/add-and-remove`, {
          recordIdsToAdd: ['62102303560'],
          recordIdsToRemove: []
        })
        .reply(200)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert',
          {inputs:[{idProperty:"email",id:"test@test.com",properties:{email:"test@test.com"}}]})
        .reply(200, upsertObjectResp)

      const responses2 = await testDestination.testAction('upsertObject', {
        event: modifiedPayload,
        settings,
        useDefaultMappings: true,
        mapping,
        features: { 'actions-hubspot-lists-association-support': true },
        subscriptionMetadata
      })

      expect(responses.length).toBe(3)
      expect(responses2.length).toBe(2)
    })

    it('should batch events together and update Lists correctly (List already exists in Hubspot)', async () => {      
      // To simplify this test properties and sensitive_properties are excluded
      const modifiedPayload = { 
        ...payload, 
        properties: {    
          contact_list_2: true,
          email: 'test@test.com'
        }
      } as SegmentEvent

      const modifiedPayload2 = { 
        ...payload, 
        properties: {    
          contact_list_2: false,
          email: 'test2@test.com'
        }
      } as SegmentEvent

      const modifiedUpsertObjectResp = {
        results: [
          {
            id: '62102303560',
            properties: {
              email: 'test@test.com'
            }
          },
          {
            id: '999999898989',
            properties: {
              email: 'test2@test.com'
            }
          }
        ]
      }

      nock(HUBSPOT_BASE_URL)
        .get(`/crm/v3/lists/object-type-id/contact/name/contact_list_2`)
        .reply(200, {
          list: {
            listId: '21',
            processingType: 'MANUAL',
            objectTypeId: '0-2',
            name: 'contact_list_2'
          }
        })

      nock(HUBSPOT_BASE_URL)
        .put(`/crm/v3/lists/21/memberships/add-and-remove`, {
          recordIdsToAdd: ['62102303560'],
          recordIdsToRemove: ['999999898989']
        })
        .reply(200)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert',
          {inputs:[{idProperty:"email",id:"test@test.com",properties:{email:"test@test.com"}}, {idProperty:"email",id:"test2@test.com",properties:{email:"test2@test.com"}}]})
        .reply(200, modifiedUpsertObjectResp)

      const responses = await testDestination.testBatchAction('upsertObject', {
        events: [modifiedPayload, modifiedPayload2],
        settings,
        useDefaultMappings: true,
        mapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(3)
    })

    it('should batch events together and update Lists correctly (List does not already exist in Hubspot)', async () => {
      // To simplify this test properties and sensitive_properties are excluded
      const modifiedPayload = { 
        ...payload, 
        properties: {    
          contact_list_2: true,
          email: 'test@test.com'
        }
      } as SegmentEvent

      const modifiedPayload2 = { 
        ...payload, 
        properties: {    
          contact_list_2: true,
          email: 'test2@test.com'
        }
      } as SegmentEvent

      const modifiedUpsertObjectResp = {
        results: [
          {
            id: '62102303560',
            properties: {
              email: 'test@test.com'
            }
          },
          {
            id: '999999898989',
            properties: {
              email: 'test2@test.com'
            }
          }
        ]
      }

      nock(HUBSPOT_BASE_URL)
        .get(`/crm/v3/lists/object-type-id/contact/name/contact_list_2`)
        .reply(400, {
          status: 'error',
          message: 'List does not exist with name contact_list_2 and object type ID 0-2.'
        })

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/lists', {name: "contact_list_2", objectTypeId: "contact", processingType: "MANUAL"})
        .reply(200, {
          list: {
            listId: "21",
            objectTypeId: "0-2",
            name: "contact_list_2"
          }
        })

      nock(HUBSPOT_BASE_URL)
        .put(`/crm/v3/lists/21/memberships/add-and-remove`, {
          recordIdsToAdd: ['62102303560', '999999898989'],
          recordIdsToRemove: []
        })
        .reply(200)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert',
          {inputs:[{idProperty:"email",id:"test@test.com",properties:{email:"test@test.com"}}, {idProperty:"email",id:"test2@test.com",properties:{email:"test2@test.com"}}]})
        .reply(200, modifiedUpsertObjectResp)

      const responses = await testDestination.testBatchAction('upsertObject', {
        events: [modifiedPayload, modifiedPayload2],
        settings,
        useDefaultMappings: true,
        mapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(4)
    })
  })

  describe('Not an Engage Audience', () => {
    it('should add a user to an existing Hubspot List.', async () => {
      const modifiedPayload = { 
        ...payload, 
        context: {}, 
        properties: { 
          ...payload.properties, 
          list_details: {
            connected_to_engage_audience: false,
            should_create_list: true,
            list_name: 'contact_list_2',
            list_action: true
          }
        }
      }

      const modifiedMapping: JSONObject = {
        ...mapping,
        list_details: {
          connected_to_engage_audience: { '@path': '$.properties.list_details.connected_to_engage_audience' },
          should_create_list: { '@path': '$.properties.list_details.should_create_list' },
          list_name: { '@path': '$.properties.list_details.list_name' },
          list_action: { '@path': '$.properties.list_details.list_action' }
        }
      }

      delete modifiedMapping['computation_key']
      delete modifiedMapping['computation_class']

      const event = createTestEvent(modifiedPayload)

      nock(HUBSPOT_BASE_URL)
        .get(`/crm/v3/lists/object-type-id/contact/name/contact_list_2`)
        .reply(200, {
          list: {
            listId: '21',
            processingType: 'MANUAL',
            objectTypeId: '0-2',
            name: 'contact_list_2'
          }
        })

      nock(HUBSPOT_BASE_URL)
        .put(`/crm/v3/lists/21/memberships/add-and-remove`, {
          recordIdsToAdd: ['62102303560'],
          recordIdsToRemove: []
        })
        .reply(200)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact')
        .reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact?dataSensitivity=sensitive')
        .reply(200, sensitivePropertiesResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq)
        .reply(200, upsertObjectResp)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: modifiedMapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(5)
    })

    it('should remove a user from an existing Hubspot List.', async () => {
      const modifiedPayload = { 
        ...payload, 
        context: {}, 
        properties: { 
          ...payload.properties, 
          list_details: {
            connected_to_engage_audience: false,
            should_create_list: true,
            list_name: 'contact_list_2',
            list_action: false
          }
        }
      }

      const modifiedMapping: JSONObject = {
        ...mapping,
        list_details: {
          connected_to_engage_audience: { '@path': '$.properties.list_details.connected_to_engage_audience' },
          should_create_list: { '@path': '$.properties.list_details.should_create_list' },
          list_name: { '@path': '$.properties.list_details.list_name' },
          list_action: { '@path': '$.properties.list_details.list_action' }
        }
      }

      delete modifiedMapping['computation_key']
      delete modifiedMapping['computation_class']

      const event = createTestEvent(modifiedPayload)

      nock(HUBSPOT_BASE_URL)
        .get(`/crm/v3/lists/object-type-id/contact/name/contact_list_2`)
        .reply(200, {
          list: {
            listId: '21',
            processingType: 'MANUAL',
            objectTypeId: '0-2',
            name: 'contact_list_2'
          }
        })

      nock(HUBSPOT_BASE_URL)
        .put(`/crm/v3/lists/21/memberships/add-and-remove`, {
          recordIdsToAdd: [],
          recordIdsToRemove: ['62102303560']
        })
        .reply(200)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact')
        .reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact?dataSensitivity=sensitive')
        .reply(200, sensitivePropertiesResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq)
        .reply(200, upsertObjectResp)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: modifiedMapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(5)
    })

    it('should add a user to an non existing Hubspot List - by creating the List first.', async () => {
      
      const modifiedPayload = { 
        ...payload, 
        context: {}, 
        properties: { 
          ...payload.properties, 
          list_details: {
            connected_to_engage_audience: false,
            should_create_list: true,
            list_name: 'contact_list_2',
            list_action: true
          }
        }
      }

      const modifiedMapping: JSONObject = {
        ...mapping,
        list_details: {
          connected_to_engage_audience: { '@path': '$.properties.list_details.connected_to_engage_audience' },
          should_create_list: { '@path': '$.properties.list_details.should_create_list' },
          list_name: { '@path': '$.properties.list_details.list_name' },
          list_action: { '@path': '$.properties.list_details.list_action' }
        }
      }
      
      const event = createTestEvent(modifiedPayload)

      nock(HUBSPOT_BASE_URL)
        .get(`/crm/v3/lists/object-type-id/contact/name/contact_list_2`)
        .reply(400, {
          status: 'error',
          message: 'List does not exist with name contact_list_2 and object type ID 0-2.'
        })

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/lists', {name: "contact_list_2", objectTypeId: "contact", processingType: "MANUAL"})
        .reply(200, {
          list: {
            listId: "21",
            objectTypeId: "0-2",
            name: "contact_list_2"
          }
        })

      nock(HUBSPOT_BASE_URL)
        .put(`/crm/v3/lists/21/memberships/add-and-remove`, {
          recordIdsToAdd: ['62102303560'],
          recordIdsToRemove: []
        })
        .reply(200)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact')
        .reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .get('/crm/v3/properties/contact?dataSensitivity=sensitive')
        .reply(200, sensitivePropertiesResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq)
        .reply(200, upsertObjectResp)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: modifiedMapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(6)
    })
  })
})


