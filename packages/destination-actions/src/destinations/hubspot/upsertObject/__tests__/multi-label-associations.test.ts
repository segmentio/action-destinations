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
  association_sync_mode: 'upsert',
  enable_batching: true,
  batch_size: 100,
  associations: [
    {
      object_type: 'company',
      association_label: 'HUBSPOT_DEFINED:279',
      id_field_name: 'kompany',
      id_field_value: { '@path': '$.properties.company_id' }
    },
    {
      object_type: 'company',
      association_label: 'HUBSPOT_DEFINED:1',
      id_field_name: 'kompany',
      id_field_value: { '@path': '$.properties.company_id' }
    }
  ]
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Hubspot.upsertObject', () => {
  describe('associated records referenced under multiple association labels', () => {
    it('should upsert the associated record once, and create one association per label', async () => {
      const upsertObjectReq = {
        inputs: [
          {
            idProperty: 'email',
            id: 'test@test.com',
            properties: {
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

      // company_id_1 is referenced by both association labels, but must appear only once in this request
      const upsertAssocCompanyRecordReq = {
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

      const upsertAssocCompanyRecordResp = {
        results: [
          {
            id: '798758764867',
            properties: {
              kompany: 'company_id_1'
            }
          }
        ]
      }

      // both labels are still associated to the same company record
      const upsertCompanyAssociationReq = {
        inputs: [
          {
            types: [
              {
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: '279'
              }
            ],
            from: {
              id: '62102303560'
            },
            to: {
              id: '798758764867'
            }
          },
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

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq).reply(200, upsertObjectResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/upsert', upsertAssocCompanyRecordReq)
        .reply(200, upsertAssocCompanyRecordResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v4/associations/contact/company/batch/create', upsertCompanyAssociationReq)
        .reply(200)

      const responses = await testDestination.testAction('upsertObject', {
        event: createTestEvent(payload),
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(3)
      expect(nock.isDone()).toBe(true)
    })

    it('should read the associated record once when the association sync mode is read', async () => {
      const upsertObjectReq = {
        inputs: [
          {
            idProperty: 'email',
            id: 'test@test.com',
            properties: {
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

      const readAssocCompanyRecordReq = {
        idProperty: 'kompany',
        properties: ['kompany'],
        inputs: [{ id: 'company_id_1' }]
      }

      const readAssocCompanyRecordResp = {
        results: [
          {
            id: '798758764867',
            properties: {
              kompany: 'company_id_1'
            }
          }
        ]
      }

      const upsertCompanyAssociationReq = {
        inputs: [
          {
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '279' }],
            from: { id: '62102303560' },
            to: { id: '798758764867' }
          },
          {
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '1' }],
            from: { id: '62102303560' },
            to: { id: '798758764867' }
          }
        ]
      }

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq).reply(200, upsertObjectResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/read', readAssocCompanyRecordReq)
        .reply(200, readAssocCompanyRecordResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v4/associations/contact/company/batch/create', upsertCompanyAssociationReq)
        .reply(200)

      const responses = await testDestination.testAction('upsertObject', {
        event: createTestEvent(payload),
        settings,
        useDefaultMappings: true,
        mapping: { ...mapping, association_sync_mode: 'read' }
      })

      expect(responses.length).toBe(3)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('multiple records associated to the same record under the same label', () => {
    it('should keep one association per record instead of de-duplicating across records', async () => {
      const payload2 = {
        ...payload,
        properties: {
          email: 'test2@test.com',
          company_id: 'company_id_1'
        }
      } as Partial<SegmentEvent>

      const singleLabelMapping = {
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

      const upsertObjectReq = {
        inputs: [
          {
            idProperty: 'email',
            id: 'test@test.com',
            properties: {
              email: 'test@test.com'
            }
          },
          {
            idProperty: 'email',
            id: 'test2@test.com',
            properties: {
              email: 'test2@test.com'
            }
          }
        ]
      }

      const upsertObjectResp = {
        results: [
          {
            id: 'hubspot_contact_id_value_1',
            properties: {
              email: 'test@test.com'
            }
          },
          {
            id: 'hubspot_contact_id_value_2',
            properties: {
              email: 'test2@test.com'
            }
          }
        ]
      }

      // both contacts reference the same company, which must be upserted only once
      const upsertAssocCompanyRecordReq = {
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

      const upsertAssocCompanyRecordResp = {
        results: [
          {
            id: '798758764867',
            properties: {
              kompany: 'company_id_1'
            }
          }
        ]
      }

      // neither contact may lose its association to the shared company
      const upsertCompanyAssociationReq = {
        inputs: [
          {
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '1' }],
            from: { id: 'hubspot_contact_id_value_1' },
            to: { id: '798758764867' }
          },
          {
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '1' }],
            from: { id: 'hubspot_contact_id_value_2' },
            to: { id: '798758764867' }
          }
        ]
      }

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq).reply(200, upsertObjectResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/upsert', upsertAssocCompanyRecordReq)
        .reply(200, upsertAssocCompanyRecordResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v4/associations/contact/company/batch/create', upsertCompanyAssociationReq)
        .reply(200)

      const responses = await testDestination.testBatchAction('upsertObject', {
        events: [createTestEvent(payload), createTestEvent(payload2)],
        settings,
        useDefaultMappings: true,
        mapping: singleLabelMapping
      })

      expect(responses.length).toBe(3)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('multiple records, each associated to the same record under multiple labels', () => {
    it('should upsert the associated record once and create every record and label combination', async () => {
      const payload2 = {
        ...payload,
        properties: {
          email: 'test2@test.com',
          company_id: 'company_id_1'
        }
      } as Partial<SegmentEvent>

      const upsertObjectReq = {
        inputs: [
          {
            idProperty: 'email',
            id: 'test@test.com',
            properties: {
              email: 'test@test.com'
            }
          },
          {
            idProperty: 'email',
            id: 'test2@test.com',
            properties: {
              email: 'test2@test.com'
            }
          }
        ]
      }

      const upsertObjectResp = {
        results: [
          {
            id: 'hubspot_contact_id_value_1',
            properties: {
              email: 'test@test.com'
            }
          },
          {
            id: 'hubspot_contact_id_value_2',
            properties: {
              email: 'test2@test.com'
            }
          }
        ]
      }

      // four association payloads (2 contacts x 2 labels) collapse to a single record input
      const upsertAssocCompanyRecordReq = {
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

      const upsertAssocCompanyRecordResp = {
        results: [
          {
            id: '798758764867',
            properties: {
              kompany: 'company_id_1'
            }
          }
        ]
      }

      // ... and fan back out to every contact and label combination
      const upsertCompanyAssociationReq = {
        inputs: [
          {
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '279' }],
            from: { id: 'hubspot_contact_id_value_1' },
            to: { id: '798758764867' }
          },
          {
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '1' }],
            from: { id: 'hubspot_contact_id_value_1' },
            to: { id: '798758764867' }
          },
          {
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '279' }],
            from: { id: 'hubspot_contact_id_value_2' },
            to: { id: '798758764867' }
          },
          {
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '1' }],
            from: { id: 'hubspot_contact_id_value_2' },
            to: { id: '798758764867' }
          }
        ]
      }

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq).reply(200, upsertObjectResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/upsert', upsertAssocCompanyRecordReq)
        .reply(200, upsertAssocCompanyRecordResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v4/associations/contact/company/batch/create', upsertCompanyAssociationReq)
        .reply(200)

      const responses = await testDestination.testBatchAction('upsertObject', {
        events: [createTestEvent(payload), createTestEvent(payload2)],
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(3)
      expect(nock.isDone()).toBe(true)
    })
  })
})
