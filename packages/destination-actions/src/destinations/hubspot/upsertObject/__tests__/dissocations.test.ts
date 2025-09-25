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
      association_label: 'USER_DEFINED:3',
      id_field_name: 'kompany',
      id_field_value: { '@path': '$.properties.company_id' }
    }
  ],
  dissociations: [
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
  describe('perform', () => {
    it('should dissociate a record and associate a record correctly', async () => {
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

      const upsertCompanyAssociationReq = {
        inputs: [
          {
            types: [
              {
                associationCategory: 'USER_DEFINED',
                associationTypeId: '3'
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

      const readReq = {
        idProperty: 'kompany',
        properties: ['kompany'],
        inputs: [{ id: 'company_id_1' }]
      }

      const readResp = {
        results: [
          {
            id: '798758764867',
            properties: {
              kompany: 'company_id_1'
            }
          }
        ]
      }

      const archiveReq = {
        inputs: [
          {
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: '1' }],
            from: {
              id: '62102303560'
            },
            to: { id: '798758764867' }
          }
        ]
      }

      const event = createTestEvent(payload)

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq).reply(200, upsertObjectResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/upsert', upsertAssocCompanyRecordReq)
        .reply(200, upsertAssocCompanyRecordResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v4/associations/contact/company/batch/create', upsertCompanyAssociationReq)
        .reply(200)

      // read request for dissociations
      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/company/batch/read', readReq).reply(200, readResp)

      nock(HUBSPOT_BASE_URL).post('/crm/v4/associations/contact/company/batch/labels/archive', archiveReq).reply(200)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(5)
    })

    it('should dissociate multiple records and associate mulitple records correctly', async () => {
      const modifiedPayload = {
        ...payload,
        properties: {
          email: 'test@test.com',
          company_id: 'company_id_1',
          company_id_2: 'company_id_2'
        }
      } as Partial<SegmentEvent>

      const modifiedMapping = {
        ...mapping,
        associations: [
          {
            object_type: 'company',
            association_label: 'USER_DEFINED:3',
            id_field_name: 'kompany',
            id_field_value: { '@path': '$.properties.company_id' }
          },
          {
            object_type: 'company',
            association_label: 'HUBSPOT_DEFINED:1',
            id_field_name: 'kompany',
            id_field_value: { '@path': '$.properties.company_id_2' }
          }
        ],
        dissociations: [
          {
            object_type: 'company',
            association_label: 'HUBSPOT_DEFINED:1',
            id_field_name: 'kompany',
            id_field_value: { '@path': '$.properties.company_id' }
          },
          {
            object_type: 'company',
            association_label: 'USER_DEFINED:3',
            id_field_name: 'kompany',
            id_field_value: { '@path': '$.properties.company_id_2' }
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

      const upsertAssocCompanyRecordReq = {
        inputs: [
          {
            idProperty: 'kompany',
            id: 'company_id_1',
            properties: {
              kompany: 'company_id_1'
            }
          },
          {
            idProperty: 'kompany',
            id: 'company_id_2',
            properties: {
              kompany: 'company_id_2'
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
          },
          {
            id: '9898989898989',
            properties: {
              kompany: 'company_id_2'
            }
          }
        ]
      }

      const upsertCompanyAssociationReq = {
        inputs: [
          {
            types: [
              {
                associationCategory: 'USER_DEFINED',
                associationTypeId: '3'
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
              id: '9898989898989'
            }
          }
        ]
      }

      const readReq = {
        idProperty: 'kompany',
        properties: ['kompany'],
        inputs: [{ id: 'company_id_1' }, { id: 'company_id_2' }]
      }

      const readResp = {
        results: [
          {
            id: '798758764867',
            properties: {
              kompany: 'company_id_1'
            }
          },
          {
            id: '9898989898989',
            properties: {
              kompany: 'company_id_2'
            }
          }
        ]
      }

      const archiveReq = {
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
            to: { id: '798758764867' }
          },
          {
            types: [
              {
                associationCategory: 'USER_DEFINED',
                associationTypeId: '3'
              }
            ],
            from: {
              id: '62102303560'
            },
            to: { id: '9898989898989' }
          }
        ]
      }

      const event = createTestEvent(modifiedPayload)

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq).reply(200, upsertObjectResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/upsert', upsertAssocCompanyRecordReq)
        .reply(200, upsertAssocCompanyRecordResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v4/associations/contact/company/batch/create', upsertCompanyAssociationReq)
        .reply(200)

      // read request for dissociations
      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/company/batch/read', readReq).reply(200, readResp)

      nock(HUBSPOT_BASE_URL).post('/crm/v4/associations/contact/company/batch/labels/archive', archiveReq).reply(200)

      const responses = await testDestination.testAction('upsertObject', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: modifiedMapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(5)
    })
  })

  describe('performBatch', () => {
    it('should handle multiple events from a batch, each dissociates multiple records and associates multiple records correctly', async () => {
      const modifiedPayload = {
        ...payload,
        properties: {
          email: 'test@test.com',
          association_1: {
            object_type: 'company',
            association_label: 'HUBSPOT_DEFINED:1',
            id_field_name: 'kompany',
            id_field_value: 'company_id_1'
          },
          association_2: {
            object_type: 'deal',
            association_label: 'HUBSPOT_DEFINED:5',
            id_field_name: 'deal_id',
            id_field_value: 'deal_id_1'
          },
          disassociation_1: {
            object_type: 'company',
            association_label: 'USER_DEFINED:3',
            id_field_name: 'kompany',
            id_field_value: 'company_id_1'
          },
          disassociation_2: {
            object_type: 'deal',
            association_label: 'USER_DEFINED:6',
            id_field_name: 'deal_id',
            id_field_value: 'deal_id_1'
          }
        }
      } as Partial<SegmentEvent>

      const modifiedPayload_2 = {
        ...payload,
        properties: {
          email: 'test2@test.com',
          association_1: {
            object_type: 'company',
            association_label: 'HUBSPOT_DEFINED:1',
            id_field_name: 'kompany',
            id_field_value: 'company_id_3'
          },
          association_2: {
            object_type: 'deal',
            association_label: 'HUBSPOT_DEFINED:5',
            id_field_name: 'deal_id',
            id_field_value: 'deal_id_3'
          },
          disassociation_1: {
            object_type: 'company',
            association_label: 'USER_DEFINED:3',
            id_field_name: 'kompany',
            id_field_value: 'company_id_3'
          },
          disassociation_2: {
            object_type: 'deal',
            association_label: 'USER_DEFINED:6',
            id_field_name: 'deal_id',
            id_field_value: 'deal_id_3'
          }
        }
      } as Partial<SegmentEvent>

      const modifiedMapping = {
        ...mapping,
        associations: [
          {
            object_type: { '@path': '$.properties.association_1.object_type' },
            association_label: { '@path': '$.properties.association_1.association_label' },
            id_field_name: { '@path': '$.properties.association_1.id_field_name' },
            id_field_value: { '@path': '$.properties.association_1.id_field_value' }
          },
          {
            object_type: { '@path': '$.properties.association_2.object_type' },
            association_label: { '@path': '$.properties.association_2.association_label' },
            id_field_name: { '@path': '$.properties.association_2.id_field_name' },
            id_field_value: { '@path': '$.properties.association_2.id_field_value' }
          }
        ],
        dissociations: [
          {
            object_type: { '@path': '$.properties.disassociation_1.object_type' },
            association_label: { '@path': '$.properties.disassociation_1.association_label' },
            id_field_name: { '@path': '$.properties.disassociation_1.id_field_name' },
            id_field_value: { '@path': '$.properties.disassociation_1.id_field_value' }
          },
          {
            object_type: { '@path': '$.properties.disassociation_2.object_type' },
            association_label: { '@path': '$.properties.disassociation_2.association_label' },
            id_field_name: { '@path': '$.properties.disassociation_2.id_field_name' },
            id_field_value: { '@path': '$.properties.disassociation_2.id_field_value' }
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

      const upsertAssocCompanyRecordReq = {
        inputs: [
          {
            idProperty: 'kompany',
            id: 'company_id_1',
            properties: {
              kompany: 'company_id_1'
            }
          },
          {
            idProperty: 'kompany',
            id: 'company_id_3',
            properties: {
              kompany: 'company_id_3'
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
          },
          {
            id: '9898989898989',
            properties: {
              kompany: 'company_id_3'
            }
          }
        ]
      }

      const upsertAssocDealRecordReq = {
        inputs: [
          {
            idProperty: 'deal_id',
            id: 'deal_id_1',
            properties: {
              deal_id: 'deal_id_1'
            }
          },
          {
            idProperty: 'deal_id',
            id: 'deal_id_3',
            properties: {
              deal_id: 'deal_id_3'
            }
          }
        ]
      }

      const upsertAssocDealRecordResp = {
        results: [
          {
            id: 'hs-deal-record-id-value-1',
            properties: {
              kompany: 'deal_id_1'
            }
          },
          {
            id: 'hs-deal-record-id-value-3',
            properties: {
              kompany: 'deal_id_3'
            }
          }
        ]
      }

      const upsertCompanyAssociationReq = {
        inputs: [
          {
            types: [
              {
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: '1'
              }
            ],
            from: {
              id: 'hubspot_contact_id_value_1'
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
              id: 'hubspot_contact_id_value_2'
            },
            to: {
              id: '9898989898989'
            }
          }
        ]
      }

      const readCompanyReq = {
        idProperty: 'kompany',
        properties: ['kompany'],
        inputs: [
          {
            id: 'company_id_1'
          },
          {
            id: 'company_id_3'
          }
        ]
      }

      const readCompanyResp = {
        results: [
          {
            id: '798758764867',
            properties: {
              kompany: 'company_id_1'
            }
          },
          {
            id: '9898989898989',
            properties: {
              kompany: 'company_id_3'
            }
          }
        ]
      }

      const readDealReq = {
        idProperty: 'deal_id',
        properties: ['deal_id'],
        inputs: [{ id: 'deal_id_1' }, { id: 'deal_id_3' }]
      }

      const readDealResp = {
        results: [
          {
            id: '66666666666',
            properties: {
              deal_id: 'hs-deal-record-id-value-1'
            }
          },
          {
            id: '555555555555',
            properties: {
              deal_id: 'hs-deal-record-id-value-3'
            }
          }
        ]
      }

      const archiveReq = {
        inputs: [
          {
            types: [
              {
                associationCategory: 'USER_DEFINED',
                associationTypeId: '3'
              }
            ],
            from: {
              id: 'hubspot_contact_id_value_1'
            },
            to: {
              id: '798758764867'
            }
          },
          {
            types: [
              {
                associationCategory: 'USER_DEFINED',
                associationTypeId: '3'
              }
            ],
            from: {
              id: 'hubspot_contact_id_value_2'
            },
            to: {
              id: '9898989898989'
            }
          }
        ]
      }

      const event1 = createTestEvent(modifiedPayload)
      const event2 = createTestEvent(modifiedPayload_2)

      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq).reply(200, upsertObjectResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/company/batch/upsert', upsertAssocCompanyRecordReq)
        .reply(200, upsertAssocCompanyRecordResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v3/objects/deal/batch/upsert', upsertAssocDealRecordReq)
        .reply(200, upsertAssocDealRecordResp)

      nock(HUBSPOT_BASE_URL)
        .post('/crm/v4/associations/contact/company/batch/create', upsertCompanyAssociationReq)
        .reply(200)

      // read request for dissociations
      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/company/batch/read', readCompanyReq).reply(200, readCompanyResp)

      // read request for dissociations
      nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/deal/batch/read', readDealReq).reply(200, readDealResp)

      nock(HUBSPOT_BASE_URL).post('/crm/v4/associations/contact/company/batch/labels/archive', archiveReq).reply(200)

      const responses = await testDestination.testBatchAction('upsertObject', {
        events: [event1, event2],
        settings,
        useDefaultMappings: true,
        mapping: modifiedMapping,
        features: { 'actions-hubspot-lists-association-support': true }
      })

      expect(responses.length).toBe(7)
    })
  })
})
