import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError, SegmentEvent } from '@segment/actions-core'
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
    company_record_id: '798758764867',
    company_id: 'company_id_1'
  }
} as Partial<SegmentEvent>

const hsObjectIdAssociation = {
  object_type: 'company',
  association_label: 'HUBSPOT_DEFINED:279',
  id_field_name: 'hs_object_id',
  id_field_value: { '@path': '$.properties.company_record_id' }
}

const kompanyAssociation = {
  object_type: 'company',
  association_label: 'HUBSPOT_DEFINED:1',
  id_field_name: 'kompany',
  id_field_value: { '@path': '$.properties.company_id' }
}

const mapping = {
  __segment_internal_sync_mode: 'upsert',
  object_details: {
    object_type: 'contact',
    id_field_name: 'email',
    id_field_value: { '@path': '$.properties.email' },
    property_group: 'contactinformation'
  },
  association_sync_mode: 'upsert',
  enable_batching: true,
  batch_size: 100,
  associations: [hsObjectIdAssociation]
}

const upsertContactReq = {
  inputs: [{ idProperty: 'email', id: 'test@test.com', properties: { email: 'test@test.com' } }]
}

const upsertContactResp = {
  results: [{ id: '62102303560', properties: { email: 'test@test.com' } }]
}

const readCompanyReq = {
  idProperty: 'hs_object_id',
  properties: ['hs_object_id'],
  inputs: [{ id: '798758764867' }]
}

const readCompanyResp = {
  results: [{ id: '798758764867', properties: { hs_object_id: '798758764867' } }]
}

const createAssociationReq = {
  inputs: [
    {
      types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '279' }],
      from: { id: '62102303560' },
      to: { id: '798758764867' }
    }
  ]
}

// Registers every endpoint a successful sync could call, so a test can assert none of them were reached.
function mockAllEndpoints() {
  nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/upsert').reply(200, upsertContactResp)
  nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/company/batch/upsert').reply(400, { category: 'VALIDATION_ERROR' })
  nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/company/batch/read').reply(200, readCompanyResp)
  nock(HUBSPOT_BASE_URL).post('/crm/v4/associations/contact/company/batch/create').reply(200)
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Hubspot.upsertObject associations identified by hs_object_id', () => {
  describe('when the Associated Record Sync Mode is Create', () => {
    it('rejects the event with a clear error and sends no requests to HubSpot', async () => {
      mockAllEndpoints()

      await expect(
        testDestination.testAction('upsertObject', {
          event: createTestEvent(payload),
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrow(PayloadValidationError)

      // all four mocks are still pending, so nothing was sent, including the main record
      expect(nock.pendingMocks()).toHaveLength(4)
    })

    it('reports a message that names the identifier and the fix', async () => {
      mockAllEndpoints()

      await expect(
        testDestination.testAction('upsertObject', {
          event: createTestEvent(payload),
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrow(/Hubspot Record ID \(hs_object_id\).*"Create".*"Do not create"/s)
    })

    it('rejects a batch and sends no requests to HubSpot', async () => {
      mockAllEndpoints()

      await expect(
        testDestination.testBatchAction('upsertObject', {
          events: [
            createTestEvent(payload),
            createTestEvent({ ...payload, properties: { ...payload.properties, email: 'second@test.com' } })
          ],
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrow(PayloadValidationError)

      expect(nock.pendingMocks()).toHaveLength(4)
    })

    it('rejects when hs_object_id is mixed with a valid identifier, instead of syncing part of the associations', async () => {
      mockAllEndpoints()

      await expect(
        testDestination.testAction('upsertObject', {
          event: createTestEvent(payload),
          settings,
          useDefaultMappings: true,
          mapping: { ...mapping, associations: [kompanyAssociation, hsObjectIdAssociation] }
        })
      ).rejects.toThrow(PayloadValidationError)

      expect(nock.pendingMocks()).toHaveLength(4)
    })

    it('rejects for the update sync mode as well, because the associated record mode is independent', async () => {
      mockAllEndpoints()

      await expect(
        testDestination.testAction('upsertObject', {
          event: createTestEvent(payload),
          settings,
          useDefaultMappings: true,
          mapping: { ...mapping, __segment_internal_sync_mode: 'update' }
        })
      ).rejects.toThrow(PayloadValidationError)

      expect(nock.pendingMocks()).toHaveLength(4)
    })

    it('still upserts the associated record for a custom unique property', async () => {
      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertContactReq)
        .reply(200, upsertContactResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/upsert', {
          inputs: [{ idProperty: 'kompany', id: 'company_id_1', properties: { kompany: 'company_id_1' } }]
        })
        .reply(200, { results: [{ id: '798758764867', properties: { kompany: 'company_id_1' } }] })

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v4/associations/contact/company/batch/create', {
          inputs: [
            {
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '1' }],
              from: { id: '62102303560' },
              to: { id: '798758764867' }
            }
          ]
        })
        .reply(200)

      const responses = await testDestination.testAction('upsertObject', {
        event: createTestEvent(payload),
        settings,
        useDefaultMappings: true,
        mapping: { ...mapping, associations: [kompanyAssociation] }
      })

      expect(responses.length).toBe(3)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('when the Associated Record Sync Mode is Do not create', () => {
    const readMapping = { ...mapping, association_sync_mode: 'read' }

    it('reads the associated record by hs_object_id and creates the association', async () => {
      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertContactReq)
        .reply(200, upsertContactResp)
      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/company/batch/read', readCompanyReq).reply(200, readCompanyResp)
      nock(HUBSPOT_BASE_URL).post('/crm/v4/associations/contact/company/batch/create', createAssociationReq).reply(200)

      const responses = await testDestination.testAction('upsertObject', {
        event: createTestEvent(payload),
        settings,
        useDefaultMappings: true,
        mapping: readMapping
      })

      expect(responses.length).toBe(3)
      expect(nock.isDone()).toBe(true)
    })

    it('syncs the main record but creates no association when the associated record does not exist', async () => {
      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', upsertContactReq)
        .reply(200, upsertContactResp)
      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/company/batch/read', readCompanyReq).reply(200, { results: [] })
      // no associations endpoint is mocked: an unmatched request would make the sync fail

      const responses = await testDestination.testAction('upsertObject', {
        event: createTestEvent(payload),
        settings,
        useDefaultMappings: true,
        mapping: readMapping
      })

      expect(responses.length).toBe(2)
      expect(nock.isDone()).toBe(true)
    })

    it('reads each record once in a batch and associates every record', async () => {
      const secondPayload = {
        ...payload,
        properties: { ...payload.properties, email: 'second@test.com', company_record_id: '111222333' }
      }

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/contact/batch/upsert', {
          inputs: [
            { idProperty: 'email', id: 'test@test.com', properties: { email: 'test@test.com' } },
            { idProperty: 'email', id: 'second@test.com', properties: { email: 'second@test.com' } }
          ]
        })
        .reply(200, {
          results: [
            { id: '62102303560', properties: { email: 'test@test.com' } },
            { id: '62102303561', properties: { email: 'second@test.com' } }
          ]
        })

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/read', {
          idProperty: 'hs_object_id',
          properties: ['hs_object_id'],
          inputs: [{ id: '798758764867' }, { id: '111222333' }]
        })
        .reply(200, {
          results: [
            { id: '798758764867', properties: { hs_object_id: '798758764867' } },
            { id: '111222333', properties: { hs_object_id: '111222333' } }
          ]
        })

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v4/associations/contact/company/batch/create', {
          inputs: [
            {
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '279' }],
              from: { id: '62102303560' },
              to: { id: '798758764867' }
            },
            {
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '279' }],
              from: { id: '62102303561' },
              to: { id: '111222333' }
            }
          ]
        })
        .reply(200)

      const responses = await testDestination.testBatchAction('upsertObject', {
        events: [createTestEvent(payload), createTestEvent(secondPayload)],
        settings,
        useDefaultMappings: true,
        mapping: readMapping
      })

      expect(responses.length).toBe(3)
      expect(nock.isDone()).toBe(true)
    })
  })
})
