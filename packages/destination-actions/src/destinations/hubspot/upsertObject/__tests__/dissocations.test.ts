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
  describe('where syncMode = upsert', () => {
    describe('All properties match on Hubspot object schema', () => {
      it('should upsert a Custom Contact Record then upsert an Associated Company Record and then create an Association', async () => {
        
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
          idProperty: "kompany", 
          properties: ["kompany"], 
          inputs: [{"id": "company_id_1"}]
        }

        const readResp = {
          results: [
            {
              id: '62102303560',
              properties: {
                email: 'test@test.com'
              }
            }
          ]
        }
        
        const event = createTestEvent(payload)

        nock(HUBSPOT_BASE_URL)
          .post('/crm/v3/objects/contact/batch/upsert', upsertObjectReq)
          .reply(200, upsertObjectResp)

        nock(HUBSPOT_BASE_URL)
          .post('/crm/v3/objects/company/batch/upsert', upsertAssocCompanyRecordReq)
          .reply(200, upsertAssocCompanyRecordResp)

        nock(HUBSPOT_BASE_URL)
          .post('/crm/v4/associations/contact/company/batch/create', upsertCompanyAssociationReq)
          .reply(200)

        // read request for dissociations
        nock(HUBSPOT_BASE_URL)
          .post('/crm/v3/objects/company/batch/read', readReq)
          .reply(200, readResp)

        const responses = await testDestination.testAction('upsertObject', {
          event,
          settings,
          useDefaultMappings: true,
          mapping,
          features: { 'actions-hubspot-lists-association-support': true }
        })

        expect(responses.length).toBe(4)
      })
    })
  })
})
