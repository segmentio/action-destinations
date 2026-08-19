import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { HUBSPOT_BASE_URL } from '../../properties'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {}

const payload = {
  event: 'Test Company Event',
  type: 'track',
  userId: '57865728900',
  properties: {
    regular: {
      str_prop: 'Hello String!'
    },
    company_record_id: '798758764867'
  }
} as Partial<SegmentEvent>

const mapping = {
  __segment_internal_sync_mode: 'update',
  object_details: {
    object_type: 'company',
    id_field_name: 'hs_object_id',
    id_field_value: { '@path': '$.userId' },
    property_group: 'companyinformation'
  },
  properties: { '@path': '$.properties.regular' },
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
    }
  ]
}

// idProperty must be omitted - hs_object_id is not a unique property, it is the record id
const readObjectReq = {
  properties: ['hs_object_id'],
  inputs: [
    {
      id: '57865728900'
    }
  ]
}

const readObjectResp = {
  results: [
    {
      id: '57865728900',
      properties: {
        hs_object_id: '57865728900'
      }
    }
  ]
}

const readNoMatchResp = {
  results: []
}

const updateCompanyReq = {
  inputs: [
    {
      id: '57865728900',
      properties: {
        str_prop: 'Hello String!'
      }
    }
  ]
}

const updateCompanyResp = {
  results: [
    {
      id: '57865728900',
      properties: {
        str_prop: 'Hello String!',
        hs_object_id: '57865728900'
      }
    }
  ]
}

// hs_object_id is read-only, so it must not be written into properties either
const upsertCompanyReq = {
  inputs: [
    {
      id: '57865728900',
      properties: {
        str_prop: 'Hello String!'
      }
    }
  ]
}

const createCompanyReq = {
  inputs: [
    {
      properties: {
        str_prop: 'Hello String!'
      }
    }
  ]
}

const createCompanyResp = {
  results: [
    {
      id: '57865728900',
      properties: {
        str_prop: 'Hello String!',
        hs_object_id: '57865728900'
      }
    }
  ]
}

const contactMapping = {
  ...mapping,
  __segment_internal_sync_mode: 'upsert',
  object_details: {
    object_type: 'contact',
    id_field_name: 'contact_id',
    id_field_value: { '@path': '$.userId' },
    property_group: 'contactinformation'
  },
  associations: [
    {
      object_type: 'company',
      association_label: 'HUBSPOT_DEFINED:1',
      id_field_name: 'hs_object_id',
      id_field_value: { '@path': '$.properties.company_record_id' }
    }
  ]
}

const upsertContactReq = {
  inputs: [
    {
      idProperty: 'contact_id',
      id: '57865728900',
      properties: {
        str_prop: 'Hello String!',
        contact_id: '57865728900'
      }
    }
  ]
}

const upsertContactResp = {
  results: [
    {
      id: '62102303560',
      properties: {
        contact_id: '57865728900'
      }
    }
  ]
}

// Associated record identified by hs_object_id: no idProperty, and no read-only property written
const upsertAssocCompanyReq = {
  inputs: [
    {
      id: '798758764867',
      properties: {}
    }
  ]
}

const readAssocCompanyReq = {
  properties: ['hs_object_id'],
  inputs: [
    {
      id: '798758764867'
    }
  ]
}

const assocCompanyResp = {
  results: [
    {
      id: '798758764867',
      properties: {
        hs_object_id: '798758764867'
      }
    }
  ]
}

const createAssociationReq = {
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
  describe('where id_field_name = hs_object_id', () => {
    it('should omit idProperty from the read and update requests when syncMode = update', async () => {
      const event = createTestEvent(payload)

      nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/company').reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/company/batch/read', readObjectReq).reply(200, readObjectResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/update', updateCompanyReq)
        .reply(200, updateCompanyResp)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(3)
    })

    it('should omit idProperty and not write hs_object_id into properties when syncMode = upsert', async () => {
      const event = createTestEvent(payload)

      nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/company').reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/upsert', upsertCompanyReq)
        .reply(200, updateCompanyResp)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { ...mapping, __segment_internal_sync_mode: 'upsert' }
      })

      expect(responses.length).toBe(2)
    })

    it('should omit idProperty and hs_object_id from the create request when syncMode = add', async () => {
      const event = createTestEvent(payload)

      nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/company').reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/company/batch/read', readObjectReq).reply(200, readNoMatchResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/create', createCompanyReq)
        .reply(200, createCompanyResp)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { ...mapping, __segment_internal_sync_mode: 'add' }
      })

      expect(responses.length).toBe(3)
    })

    it('should omit idProperty when upserting an associated record identified by hs_object_id', async () => {
      const event = createTestEvent(payload)

      nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/contact').reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertContactReq)
        .reply(200, upsertContactResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/upsert', upsertAssocCompanyReq)
        .reply(200, assocCompanyResp)

      nock(HUBSPOT_BASE_URL).post('/crm/v4/associations/contact/company/batch/create', createAssociationReq).reply(200)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: contactMapping
      })

      expect(responses.length).toBe(4)
    })

    it('should omit idProperty when reading an associated record identified by hs_object_id', async () => {
      const event = createTestEvent(payload)

      nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/contact').reply(200, propertiesResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertContactReq)
        .reply(200, upsertContactResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/read', readAssocCompanyReq)
        .reply(200, assocCompanyResp)

      nock(HUBSPOT_BASE_URL).post('/crm/v4/associations/contact/company/batch/create', createAssociationReq).reply(200)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: { ...contactMapping, association_sync_mode: 'read' }
      })

      expect(responses.length).toBe(4)
    })
  })
})
