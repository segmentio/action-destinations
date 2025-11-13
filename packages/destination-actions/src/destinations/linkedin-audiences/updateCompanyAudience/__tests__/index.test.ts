import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL, LINKEDIN_SOURCE_PLATFORM } from '../../constants'

let testDestination = createTestIntegration(Destination)

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

const auth: AuthTokens = {
  accessToken: 'test',
  refreshToken: 'test'
}

const event = createTestEvent({
  type: 'group',
  traits: {
    company_domain: "companyDomain1.com",
    linkedin_company_id: 'linkedInCompanyId1',
    personas_test_audience: true
  },
  context: {
    personas: {
      computation_key: 'personas_test_audience',
      computation_class: 'audience'
    }
  }
})

const event2 = createTestEvent({
  type: 'group',
  traits: {
    company_domain: "companyDomain2.com",
    linkedin_company_id: 'linkedInCompanyId2',
    personas_test_audience: true
  },
  context: {
    personas: {
      computation_key: 'personas_test_audience',
      computation_class: 'audience'
    }
  }
})

const urlParams = {
  q: 'account',
  account: 'urn:li:sponsoredAccount:123',
  sourceSegmentId: 'personas_test_audience',
  sourcePlatform: LINKEDIN_SOURCE_PLATFORM
}

const updateCompaniesRequestBody = {
  elements: [
    {
      action: 'ADD',
      companyIds: [
        {
          idType: "DOMAIN",
          idValue: "companyDomain1.com"
        },
        {
          idType: "LINKEDIN_COMPANY_ID",
          idValue: "linkedInCompanyId1"
        }
      ]
    }
  ]
}

const updateCompaniesResonse = {
  elements: [
    {
      status: 200
    },
      {
      status: 200
    }
  ]
}

const createDmpSegmentRequestBody = {
  name: "personas_test_audience",
  sourcePlatform: LINKEDIN_SOURCE_PLATFORM,
  sourceSegmentId: "personas_test_audience",
  account: "urn:li:sponsoredAccount:123",
  type: "COMPANY",
  destinations: [
    {
      destination: "LINKEDIN"
    }
  ]
}

beforeEach((done) => {
  testDestination = createTestIntegration(Destination)
  nock.cleanAll()
  done()
})

describe('LinkedinAudiences.updateCompanyAudience', () => {
  describe('Successful cases', () => {
    it('should send the right (non-batch) payload - Segment already exists', async () => {
      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "COMPANY" }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/companies`).post(/.*/, updateCompaniesRequestBody).reply(200)
      
      const responses = await testDestination.testAction('updateCompanyAudience', {
          event,
          settings: {
            ad_account_id: '123',
            send_email: false,
            send_google_advertising_id: false
          },
          useDefaultMappings: true,
          auth,
          mapping: {
            action: 'AUTO',
            segment_creation_name: { '@path': '$.context.personas.computation_key'},
            computation_key: { '@path': '$.context.personas.computation_key'}, 
            computation_class: {'@path': '$.context.personas.computation_class'},
            enable_batching: true,
            batch_keys: ['computation_key']   
          }
        })
        expect(responses.length).toBe(2)
    })

    it('should send the right (batch) payload - Segment already exists', async () => {

      const updateCompaniesRequestBody2 = {
        elements: [
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain1.com"
              },
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId1"
              }
            ]
          },
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain2.com"
              },
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId2"
              }
            ]
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "COMPANY" }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/companies`).post(/.*/, updateCompaniesRequestBody2).reply(200, updateCompaniesResonse)
      
      const responses = await testDestination.testBatchAction('updateCompanyAudience', {
        events: [event,event2],
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          action: 'AUTO',
          segment_creation_name: { '@path': '$.context.personas.computation_key'},
          computation_key: { '@path': '$.context.personas.computation_key'}, 
          computation_class: {'@path': '$.context.personas.computation_class'},
          enable_batching: true,
          batch_keys: ['computation_key']   
        }
      })
      expect(responses.length).toBe(2)
    })

    it('should get the correct multistatusResponse from a (batch) payload - Segment already exists', async () => {

      const updateCompaniesRequestBody2 = {
        elements: [
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain1.com"
              },
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId1"
              }
            ]
          },
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain2.com"
              },
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId2"
              }
            ]
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "COMPANY" }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/companies`).post(/.*/, updateCompaniesRequestBody2).reply(200, updateCompaniesResonse)
      
      const responses = await testDestination.executeBatch('updateCompanyAudience', {
        events: [event,event2],
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        auth,
        mapping: {
          action: 'AUTO',
          identifiers: {
            companyDomain: {"@path": "$.traits.company_domain"},
            linkedInCompanyId: {"@path": "$.traits.linkedin_company_id"},
          },
          traits_or_props: {"@path": "$.traits"},
          segment_creation_name: { '@path': '$.context.personas.computation_key'},
          computation_key: { '@path': '$.context.personas.computation_key'}, 
          computation_class: {'@path': '$.context.personas.computation_class'},
          enable_batching: true,
          batch_keys: ['computation_key']   
        }
      })
      expect(responses).toMatchObject([
        {
          status: 200,
          sent: {
            action: "AUTO",
            identifiers: {
              companyDomain: "companyDomain1.com",
              linkedInCompanyId: "linkedInCompanyId1"
            },
            traits_or_props: {
              company_domain: "companyDomain1.com",
              linkedin_company_id: "linkedInCompanyId1",
              personas_test_audience: true
            },
            segment_creation_name: "personas_test_audience",
            computation_key: "personas_test_audience",
            computation_class: "audience",
            enable_batching: true,
            batch_keys: ["computation_key"],
            index: 0
          },
          body: {
            elements: [
              {
                action: "ADD",
                companyIds: [
                  { idType: "DOMAIN", idValue: "companyDomain1.com" },
                  { idType: "LINKEDIN_COMPANY_ID", idValue: "linkedInCompanyId1" }
                ]
              }
            ]
          }
        },
        {
          status: 200,
          sent: {
            action: "AUTO",
            identifiers: {
              companyDomain: "companyDomain2.com",
              linkedInCompanyId: "linkedInCompanyId2"
            },
            traits_or_props: {
              company_domain: "companyDomain2.com",
              linkedin_company_id: "linkedInCompanyId2",
              personas_test_audience: true
            },
            segment_creation_name: "personas_test_audience",
            computation_key: "personas_test_audience",
            computation_class: "audience",
            enable_batching: true,
            batch_keys: ["computation_key"],
            index: 1
          },
          body: {
            elements: [
              {
                action: "ADD",
                companyIds: [
                  { idType: "DOMAIN", idValue: "companyDomain2.com" },
                  { idType: "LINKEDIN_COMPANY_ID", idValue: "linkedInCompanyId2" }
                ]
              }
            ]
          }
        }
      ])
    })

    it('should get the correct multistatusResponse from a (batch) payload - add and remove - different ID types - Segment already exists', async () => {

      const event3 = createTestEvent({
        type: 'group',
        traits: {
          linkedin_company_id: 'linkedInCompanyId1',
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const event4 = createTestEvent({
        type: 'group',
        traits: {
          company_domain: "companyDomain2.com",
          personas_test_audience: false
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const updateCompaniesRequestBody2 = {
        elements: [
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId1"
              }
            ]
          },
          {
            action: 'REMOVE',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain2.com"
              }
            ]
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "COMPANY" }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/companies`).post(/.*/, updateCompaniesRequestBody2).reply(200, updateCompaniesResonse)
      
      const responses = await testDestination.executeBatch('updateCompanyAudience', {
        events: [event3,event4],
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        auth,
        mapping: {
          action: 'AUTO',
          identifiers: {
            companyDomain: {"@path": "$.traits.company_domain"},
            linkedInCompanyId: {"@path": "$.traits.linkedin_company_id"},
          },
          traits_or_props: {"@path": "$.traits"},
          segment_creation_name: { '@path': '$.context.personas.computation_key'},
          computation_key: { '@path': '$.context.personas.computation_key'}, 
          computation_class: {'@path': '$.context.personas.computation_class'},
          enable_batching: true,
          batch_keys: ['computation_key']   
        }
      })
      expect(responses).toMatchObject([
        {
          status: 200,
          sent: {
            action: "AUTO",
            identifiers: {
              linkedInCompanyId: "linkedInCompanyId1"
            },
            traits_or_props: {
              linkedin_company_id: "linkedInCompanyId1",
              personas_test_audience: true
            },
            segment_creation_name: "personas_test_audience",
            computation_key: "personas_test_audience",
            computation_class: "audience",
            enable_batching: true,
            batch_keys: ["computation_key"],
            index: 0
          },
          body: {
            elements: [
              {
                action: "ADD",
                companyIds: [
                  { idType: "LINKEDIN_COMPANY_ID", idValue: "linkedInCompanyId1" }
                ]
              }
            ]
          }
        },
        {
          status: 200,
          sent: {
            action: "AUTO",
            identifiers: {
              companyDomain: "companyDomain2.com",
            },
            traits_or_props: {
              company_domain: "companyDomain2.com",
              personas_test_audience: false
            },
            segment_creation_name: "personas_test_audience",
            computation_key: "personas_test_audience",
            computation_class: "audience",
            enable_batching: true,
            batch_keys: ["computation_key"],
            index: 1
          },
          body: {
            elements: [
              {
                action: "REMOVE",
                companyIds: [
                  { idType: "DOMAIN", idValue: "companyDomain2.com" }
                ]
              }
            ]
          }
        }
      ])
    })

    it('should get the correct multistatusResponse from a (batch) payload - add only - different ID types - Creates new Segment', async () => {

      const event3 = createTestEvent({
        type: 'group',
        traits: {
          linkedin_company_id: 'linkedInCompanyId1',
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const event4 = createTestEvent({
        type: 'group',
        traits: {
          company_domain: "companyDomain2.com",
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const updateCompaniesRequestBody2 = {
        elements: [
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId1"
              }
            ]
          },
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain2.com"
              }
            ]
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: []})
      
      nock(`${BASE_URL}/dmpSegments`)
        .post(/.*/, createDmpSegmentRequestBody)
        .reply(200, { id: 'dmp_segment_id', type: "COMPANY" })

      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/companies`).post(/.*/, updateCompaniesRequestBody2).reply(200, updateCompaniesResonse)
      
      const responses = await testDestination.executeBatch('updateCompanyAudience', {
        events: [event3,event4],
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        auth,
        mapping: {
          action: 'AUTO',
          identifiers: {
            companyDomain: {"@path": "$.traits.company_domain"},
            linkedInCompanyId: {"@path": "$.traits.linkedin_company_id"},
          },
          traits_or_props: {"@path": "$.traits"},
          segment_creation_name: { '@path': '$.context.personas.computation_key'},
          computation_key: { '@path': '$.context.personas.computation_key'}, 
          computation_class: {'@path': '$.context.personas.computation_class'},
          enable_batching: true,
          batch_keys: ['computation_key']   
        }
      })

      expect(responses).toMatchObject([
        {
          status: 200,
          sent: {
            action: "AUTO",
            identifiers: {
              linkedInCompanyId: "linkedInCompanyId1"
            },
            traits_or_props: {
              linkedin_company_id: "linkedInCompanyId1",
              personas_test_audience: true
            },
            segment_creation_name: "personas_test_audience",
            computation_key: "personas_test_audience",
            computation_class: "audience",
            enable_batching: true,
            batch_keys: ["computation_key"],
            index: 0
          },
          body: {
            elements: [
              {
                action: "ADD",
                companyIds: [
                  { idType: "LINKEDIN_COMPANY_ID", idValue: "linkedInCompanyId1" }
                ]
              }
            ]
          }
        },
        {
          status: 200,
          sent: {
            action: "AUTO",
            identifiers: {
              companyDomain: "companyDomain2.com",
            },
            traits_or_props: {
              company_domain: "companyDomain2.com",
              personas_test_audience: true
            },
            segment_creation_name: "personas_test_audience",
            computation_key: "personas_test_audience",
            computation_class: "audience",
            enable_batching: true,
            batch_keys: ["computation_key"],
            index: 1
          },
          body: {
            elements: [
              {
                action: "ADD",
                companyIds: [
                  { idType: "DOMAIN", idValue: "companyDomain2.com" }
                ]
              }
            ]
          }
        }
      ])
    })

    it('should get the correct multistatusResponse from a (batch) payload - add only - different ID types - Creates new Segment with name in segment_creation_name field', async () => {

      const event3 = createTestEvent({
        type: 'group',
        traits: {
          linkedin_company_id: 'linkedInCompanyId1',
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const event4 = createTestEvent({
        type: 'group',
        traits: {
          company_domain: "companyDomain2.com",
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const updateCompaniesRequestBody2 = {
        elements: [
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId1"
              }
            ]
          },
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain2.com"
              }
            ]
          }
        ]
      }

      const createDmpSegmentRequestBody2 = {
        name: "NEW_SEGMENT_NAME_XYZ",
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM,
        sourceSegmentId: "personas_test_audience",
        account: "urn:li:sponsoredAccount:123",
        type: "COMPANY",
        destinations: [
          {
            destination: "LINKEDIN"
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: []})
      
      nock(`${BASE_URL}/dmpSegments`)
        .post(/.*/, createDmpSegmentRequestBody2)
        .reply(200, { id: 'dmp_segment_id', type: "COMPANY" })

      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/companies`).post(/.*/, updateCompaniesRequestBody2).reply(200, updateCompaniesResonse)
      
      const responses = await testDestination.executeBatch('updateCompanyAudience', {
        events: [event3,event4],
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        auth,
        mapping: {
          action: 'AUTO',
          identifiers: {
            companyDomain: {"@path": "$.traits.company_domain"},
            linkedInCompanyId: {"@path": "$.traits.linkedin_company_id"},
          },
          traits_or_props: {"@path": "$.traits"},
          segment_creation_name: 'NEW_SEGMENT_NAME_XYZ',
          computation_key: { '@path': '$.context.personas.computation_key'}, 
          computation_class: {'@path': '$.context.personas.computation_class'},
          enable_batching: true,
          batch_keys: ['computation_key']   
        }
      })

      expect(responses).toMatchObject([
        {
          status: 200,
          sent: {
            action: "AUTO",
            identifiers: {
              linkedInCompanyId: "linkedInCompanyId1"
            },
            traits_or_props: {
              linkedin_company_id: "linkedInCompanyId1",
              personas_test_audience: true
            },
            segment_creation_name: "NEW_SEGMENT_NAME_XYZ",
            computation_key: "personas_test_audience",
            computation_class: "audience",
            enable_batching: true,
            batch_keys: ["computation_key"],
            index: 0
          },
          body: {
            elements: [
              {
                action: "ADD",
                companyIds: [
                  { idType: "LINKEDIN_COMPANY_ID", idValue: "linkedInCompanyId1" }
                ]
              }
            ]
          }
        },
        {
          status: 200,
          sent: {
            action: "AUTO",
            identifiers: {
              companyDomain: "companyDomain2.com",
            },
            traits_or_props: {
              company_domain: "companyDomain2.com",
              personas_test_audience: true
            },
            segment_creation_name: "NEW_SEGMENT_NAME_XYZ",
            computation_key: "personas_test_audience",
            computation_class: "audience",
            enable_batching: true,
            batch_keys: ["computation_key"],
            index: 1
          },
          body: {
            elements: [
              {
                action: "ADD",
                companyIds: [
                  { idType: "DOMAIN", idValue: "companyDomain2.com" }
                ]
              }
            ]
          }
        }
      ])
    })

    it('should let the customer hard code the Action to "ADD" - (batch) payload - Segment already exists', async () => {

      const updateCompaniesRequestBody2 = {
        elements: [
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain1.com"
              },
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId1"
              }
            ]
          },
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain2.com"
              },
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId2"
              }
            ]
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "COMPANY" }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/companies`).post(/.*/, updateCompaniesRequestBody2).reply(200, updateCompaniesResonse)
      
      const event3 = createTestEvent({
        type: 'group',
        traits: {
          company_domain: "companyDomain1.com",
          linkedin_company_id: 'linkedInCompanyId1',
          personas_test_audience: false // This should get overridden to true. i.e ignored
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const event4 = createTestEvent({
        type: 'group',
        traits: {
          company_domain: "companyDomain2.com",
          linkedin_company_id: 'linkedInCompanyId2',
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const responses = await testDestination.testBatchAction('updateCompanyAudience', {
        events: [event3,event4],
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          action: 'ADD',
          segment_creation_name: { '@path': '$.context.personas.computation_key'},
          computation_key: { '@path': '$.context.personas.computation_key'}, 
          computation_class: {'@path': '$.context.personas.computation_class'},
          enable_batching: true,
          batch_keys: ['computation_key']   
        }
      })
      expect(responses.length).toBe(2)
    })

    it('should let the customer hard code the Action to "REMOVE" - (batch) payload - Segment already exists', async () => {

      const updateCompaniesRequestBody2 = {
        elements: [
          {
            action: 'REMOVE',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain1.com"
              },
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId1"
              }
            ]
          },
          {
            action: 'REMOVE',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain2.com"
              },
              {
                idType: "LINKEDIN_COMPANY_ID",
                idValue: "linkedInCompanyId2"
              }
            ]
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "COMPANY" }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/companies`).post(/.*/, updateCompaniesRequestBody2).reply(200, updateCompaniesResonse)
      
      const event3 = createTestEvent({
        type: 'group',
        traits: {
          company_domain: "companyDomain1.com",
          linkedin_company_id: 'linkedInCompanyId1',
          personas_test_audience: true // This should get overridden to false. i.e ignored
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const event4 = createTestEvent({
        type: 'group',
        traits: {
          company_domain: "companyDomain2.com",
          linkedin_company_id: 'linkedInCompanyId2',
          personas_test_audience: false
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const responses = await testDestination.testBatchAction('updateCompanyAudience', {
        events: [event3,event4],
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          action: 'REMOVE',
          segment_creation_name: { '@path': '$.context.personas.computation_key'},
          computation_key: { '@path': '$.context.personas.computation_key'}, 
          computation_class: {'@path': '$.context.personas.computation_class'},
          enable_batching: true,
          batch_keys: ['computation_key']   
        }
      })
      expect(responses.length).toBe(2)
    })
  })

  describe('Error cases', () => {
    it('should fail if both `send_email` and `send_google_advertising_id` settings are set to false', async () => {
      await expect(
        testDestination.testAction('updateAudience', {
          event,
          settings: {
            ad_account_id: '123',
            send_email: false,
            send_google_advertising_id: false
          },
          useDefaultMappings: true,
          auth
        })
      ).rejects.toThrow("At least one of 'Send Email' or 'Send Google Advertising ID' setting fields must be set to 'true'.")
    })

    it('should throw error if no identifiers in (non-batch) payload - Segment already exists', async () => {
      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "COMPANY" }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/companies`).post(/.*/, updateCompaniesRequestBody).reply(200)
      
      const event3 = createTestEvent({
        type: 'group',
        traits: {
          // company_domain: "companyDomain2.com",
          // linkedin_company_id: 'linkedInCompanyId2',
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      await expect (testDestination.testAction('updateCompanyAudience', {
        event: event3,
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          action: 'AUTO',
          segment_creation_name: { '@path': '$.context.personas.computation_key'},
          computation_key: { '@path': '$.context.personas.computation_key'}, 
          computation_class: {'@path': '$.context.personas.computation_class'},
          enable_batching: true,
          batch_keys: ['computation_key']   
        }
      })).rejects.toThrow("At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field.")
    })

    it('multistatus response should be correct when some 200 and some 400 items in (batch) payload - Segment already exists', async () => {
      
      const updateCompaniesRequestBody2 = {
        elements: [
          {
            action: 'ADD',
            companyIds: [
              {
                idType: "DOMAIN",
                idValue: "companyDomain2.com"
              }
            ]
          }
        ]
      }

      const updateCompaniesResonse2 = {
        elements: [
          {
            status: 200
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "COMPANY" }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/companies`).post(/.*/, updateCompaniesRequestBody2).reply(200, updateCompaniesResonse2)

      const event3 = createTestEvent({
        // NO identifiers for this event - should return a 400 in multistatus response
        type: 'group',
        traits: {
          // company_domain: "companyDomain2.com",
          // linkedin_company_id: 'linkedInCompanyId2',
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const event4 = createTestEvent({
        // This event has 1 identifier - should be processed successfully
        type: 'group',
        traits: {
          company_domain: "companyDomain2.com",
          // linkedin_company_id: 'linkedInCompanyId2',
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })
      
      const responses = await testDestination.executeBatch('updateCompanyAudience', {
        events: [event3, event4],
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        auth,
        mapping: {
          action: 'AUTO',
          identifiers: {
            companyDomain: {"@path": "$.traits.company_domain"},
            linkedInCompanyId: {"@path": "$.traits.linkedin_company_id"},
          },
          traits_or_props: {"@path": "$.traits"},
          segment_creation_name: { '@path': '$.context.personas.computation_key'},
          computation_key: { '@path': '$.context.personas.computation_key'}, 
          computation_class: {'@path': '$.context.personas.computation_class'},
          enable_batching: true,
          batch_keys: ['computation_key']   
        }
      })

      expect(responses).toMatchObject([
        {
          status: 400,
          errortype: "PAYLOAD_VALIDATION_FAILED",
          errormessage: "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field.",
          errorreporter: "INTEGRATIONS"
        },
        {
          status: 200,
          sent: {
            action: "AUTO",
            identifiers: {
              companyDomain: "companyDomain2.com"
            },
            traits_or_props: {
              company_domain: "companyDomain2.com",
              personas_test_audience: true
            },
            segment_creation_name: "personas_test_audience",
            computation_key: "personas_test_audience",
            computation_class: "audience",
            enable_batching: true,
            batch_keys: ["computation_key"],
            index: 1
          },
          body: {
            elements: [
              {
                action: "ADD",
                companyIds: [
                  { idType: "DOMAIN", idValue: "companyDomain2.com" }
                ]
              }
            ]
          }
        }
      ])
    })
  
    it('multistatus response should be correct when all 400 items in (batch) payload - Segment already exists', async () => {
      
      const event3 = createTestEvent({
        // NO identifiers for this event - should return a 400 in multistatus response
        type: 'group',
        traits: {
          // company_domain: "companyDomain2.com",
          // linkedin_company_id: 'linkedInCompanyId2',
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })

      const event4 = createTestEvent({
        // NO identifiers for this event - should return a 400 in multistatus response
        type: 'group',
        traits: {
          // company_domain: "companyDomain2.com",
          // linkedin_company_id: 'linkedInCompanyId2',
          personas_test_audience: true
        },
        context: {
          personas: {
            computation_key: 'personas_test_audience',
            computation_class: 'audience'
          }
        }
      })
      
      const responses = await testDestination.executeBatch('updateCompanyAudience', {
        events: [event3, event4],
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        auth,
        mapping: {
          action: 'AUTO',
          identifiers: {
            companyDomain: {"@path": "$.traits.company_domain"},
            linkedInCompanyId: {"@path": "$.traits.linkedin_company_id"},
          },
          traits_or_props: {"@path": "$.traits"},
          segment_creation_name: { '@path': '$.context.personas.computation_key'},
          computation_key: { '@path': '$.context.personas.computation_key'}, 
          computation_class: {'@path': '$.context.personas.computation_class'},
          enable_batching: true,
          batch_keys: ['computation_key']   
        }
      })

      expect(responses).toMatchObject([
        {
          status: 400,
          errortype: "PAYLOAD_VALIDATION_FAILED",
          errormessage: "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field.",
          errorreporter: "INTEGRATIONS"
        },
        {
          status: 400,
          errortype: "PAYLOAD_VALIDATION_FAILED",
          errormessage: "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field.",
          errorreporter: "INTEGRATIONS"
        }
      ])
    })
  })
})
