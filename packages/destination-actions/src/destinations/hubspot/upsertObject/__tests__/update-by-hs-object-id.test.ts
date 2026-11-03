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
    }
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

// batch/read accepts hs_object_id as idProperty, so the read is unchanged
const readObjectReq = {
  properties: ['hs_object_id'],
  idProperty: 'hs_object_id',
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

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Hubspot.upsertObject', () => {
  describe('where syncMode = update and id_field_name = hs_object_id', () => {
    it('should omit idProperty from the update request', async () => {
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
  })
})
