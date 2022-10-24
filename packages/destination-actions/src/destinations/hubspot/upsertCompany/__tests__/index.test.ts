import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { HUBSPOT_BASE_URL, SEGMENT_UNIQUE_IDENTIFIER, ASSOCIATION_TYPE } from '../../properties'
import {
  RestrictedPropertyThrowableError,
  MissingIdentityCallThrowableError,
  CompanySearchThrowableError,
  MultipleCompaniesInSearchResultThrowableError,
  SegmentUniqueIdentifierMissingRetryableError
} from '../../errors'

const testDestination = createTestIntegration(Destination)

const setTransaction = () => {}

beforeEach((done) => {
  nock.cleanAll()
  done()
})

// Default Group Mapping
const defaultGroupMapping = {
  groupid: {
    '@if': {
      exists: { '@path': '$.groupId' },
      then: { '@path': '$.groupId' },
      else: { '@path': '$.context.groupId' }
    }
  },
  name: {
    '@path': '$.traits.name'
  },
  description: {
    '@path': '$.traits.description'
  },
  createdate: {
    '@path': '$.traits.createdAt'
  },
  streetaddress: {
    '@path': '$.traits.address.street'
  },
  city: {
    '@path': '$.traits.address.city'
  },
  state: {
    '@path': '$.traits.address.state'
  },
  postalcode: {
    '@if': {
      exists: { '@path': '$.traits.address.postalCode' },
      then: { '@path': '$.traits.address.postalCode' },
      else: { '@path': '$.traits.address.postal_code' }
    }
  },
  domain: {
    '@path': '$.traits.website'
  },
  phone: {
    '@path': '$.traits.phone'
  },
  numberofemployees: {
    '@path': '$.traits.employees'
  },
  industry: {
    '@path': '$.traits.industry'
  }
  // companysearchfields: {},
  // lifecyclestage: {},
  // properties: {}
}

describe('HubSpot.upsertCompany', () => {
  it('should throw an error if contact_id is missing in transactionContext', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          }
        },
        transactionContext: {
          transaction: {},
          setTransaction
        }
      })
    ).rejects.toThrowError(MissingIdentityCallThrowableError)
  })

  it('should update a company with SEGMENT_UNIQUE_IDENTIFIER and associate a contact', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const contactId = '123456789'
    const hubspotGeneratedCompanyID = '1000000000'

    // Mock: Update company using SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(200, {
        id: hubspotGeneratedCompanyID,
        properties: {
          createdate: '2022-10-13T17:57:46.778Z',
          hs_all_owner_ids: '100000000',
          hs_created_by_user_id: '10000000',
          hs_lastmodifieddate: '2022-10-13T17:58:14.622Z',
          hs_object_id: hubspotGeneratedCompanyID,
          hs_pipeline: 'companies-lifecycle-pipeline',
          hs_updated_by_user_id: '10000000',
          hs_user_ids_of_all_owners: '10000000',
          hubspot_owner_assigneddate: '2022-10-13T17:57:46.778Z',
          hubspot_owner_id: '100000000',
          lifecyclestage: 'lead',
          segment_group_id: event?.groupId
        },
        createdAt: '2022-10-13T17:57:46.778Z',
        updatedAt: '2022-10-13T17:58:14.622Z',
        archived: false
      })

    // Mock: Associate a contact with company
    nock(HUBSPOT_BASE_URL)
      .put(
        `/crm/v3/objects/companies/${hubspotGeneratedCompanyID}/associations/contacts/${contactId}/${ASSOCIATION_TYPE}`
      )
      .reply(200, {
        id: '100000000',
        properties: {
          createdate: '2022-09-25T19:56:33.914Z',
          hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
          hs_object_id: '100000000'
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false,
        associations: {
          contacts: {
            results: [
              {
                id: contactId,
                type: ASSOCIATION_TYPE
              },
              {
                id: contactId,
                type: `${ASSOCIATION_TYPE}_unlabeled`
              }
            ]
          }
        }
      })

    const responses = await testDestination.testAction('upsertCompany', {
      event,
      mapping: {
        ...defaultGroupMapping,
        companysearchfields: {
          domain: {
            '@path': '$.traits.website'
          }
        }
      },
      transactionContext: {
        transaction: {
          contact_id: contactId
        },
        setTransaction
      }
    })

    expect(responses[0].status).toEqual(200)
    expect(responses[1].status).toEqual(200)
  })

  it('should update a company with Company Search Fields and associate a contact', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const contactId = '123456789'
    const hubspotGeneratedCompanyID = '1000000000'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company with Company Search Fields
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/objects/companies/search')
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedCompanyID,
            properties: {
              createdate: '2022-09-25T19:56:33.914Z',
              domain: 'test-company.com',
              hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCompanyID,
              name: 'Test Company',
              segment_group_id: null
            },
            createdAt: '2022-09-25T19:56:33.914Z',
            updatedAt: '2022-10-14T13:19:08.067Z',
            archived: false
          }
        ]
      })

    // Mock: Update a company with Company ID
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${hubspotGeneratedCompanyID}`)
      .reply(200, {
        id: 'hubspotGeneratedCompanyID',
        properties: {
          createdate: '2022-09-25T19:56:33.914Z',
          hs_all_owner_ids: '100000000',
          hs_created_by_user_id: '1000000',
          hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
          hs_object_id: hubspotGeneratedCompanyID,
          hs_pipeline: 'companies-lifecycle-pipeline',
          hs_updated_by_user_id: '1000000',
          hs_user_ids_of_all_owners: '1000000',
          hubspot_owner_assigneddate: '2022-09-25T19:56:33.914Z',
          hubspot_owner_id: '1000000',
          lifecyclestage: 'lead',
          name: event?.traits?.name,
          domain: event?.traits?.website,
          website: event?.traits?.website
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false
      })

    // Mock: Associate a contact with company
    nock(HUBSPOT_BASE_URL)
      .put(
        `/crm/v3/objects/companies/${hubspotGeneratedCompanyID}/associations/contacts/${contactId}/${ASSOCIATION_TYPE}`
      )
      .reply(200, {
        id: '100000000',
        properties: {
          createdate: '2022-09-25T19:56:33.914Z',
          hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
          hs_object_id: '100000000'
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false,
        associations: {
          contacts: {
            results: [
              {
                id: contactId,
                type: ASSOCIATION_TYPE
              },
              {
                id: contactId,
                type: `${ASSOCIATION_TYPE}_unlabeled`
              }
            ]
          }
        }
      })

    const responses = await testDestination.testAction('upsertCompany', {
      event,
      mapping: {
        ...defaultGroupMapping,
        companysearchfields: {
          domain: {
            '@path': '$.traits.website'
          }
        }
      },
      transactionContext: {
        transaction: {
          contact_id: contactId
        },
        setTransaction
      }
    })

    expect(responses[0].status).toEqual(404)
    expect(responses[1].status).toEqual(200)
    expect(responses[2].status).toEqual(200)
    expect(responses[3].status).toEqual(200)
  })

  it('should create a company with and associate a contact', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const contactId = '123456789'
    const hubspotGeneratedCompanyID = '1000000000'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company returned no results
    nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/companies/search').reply(200, {
      total: 0,
      results: []
    })

    // Mock: Create a company with Company ID
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/objects/companies')
      .reply(201, {
        id: hubspotGeneratedCompanyID,
        properties: {
          createdate: '2022-09-25T19:56:33.914Z',
          hs_all_owner_ids: '100000000',
          hs_created_by_user_id: '1000000',
          hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
          hs_object_id: hubspotGeneratedCompanyID,
          hs_pipeline: 'companies-lifecycle-pipeline',
          hs_updated_by_user_id: '1000000',
          hs_user_ids_of_all_owners: '1000000',
          hubspot_owner_assigneddate: '2022-09-25T19:56:33.914Z',
          hubspot_owner_id: '1000000',
          lifecyclestage: 'lead',
          name: event?.traits?.name,
          domain: event?.traits?.website,
          website: event?.traits?.website
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false
      })

    // Mock: Associate a contact with company
    nock(HUBSPOT_BASE_URL)
      .put(
        `/crm/v3/objects/companies/${hubspotGeneratedCompanyID}/associations/contacts/${contactId}/${ASSOCIATION_TYPE}`
      )
      .reply(200, {
        id: '100000000',
        properties: {
          createdate: '2022-09-25T19:56:33.914Z',
          hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
          hs_object_id: '100000000'
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false,
        associations: {
          contacts: {
            results: [
              {
                id: contactId,
                type: ASSOCIATION_TYPE
              },
              {
                id: contactId,
                type: `${ASSOCIATION_TYPE}_unlabeled`
              }
            ]
          }
        }
      })

    const responses = await testDestination.testAction('upsertCompany', {
      event,
      mapping: {
        ...defaultGroupMapping,
        companysearchfields: {
          domain: {
            '@path': '$.traits.website'
          }
        }
      },
      transactionContext: {
        transaction: {
          contact_id: contactId
        },
        setTransaction
      }
    })

    expect(responses[0].status).toEqual(404)
    expect(responses[1].status).toEqual(200)
    expect(responses[2].status).toEqual(201)
    expect(responses[3].status).toEqual(200)
  })

  it('should create SEGMENT_UNIQUE_IDENTIFIER and create a company if SEGMENT_UNIQUE_IDENTIFIER property is not found', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const contactId = '123456789'
    const hubspotGeneratedCompanyID = '1000000000'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company returned no results
    nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/companies/search').reply(200, {
      total: 0,
      results: []
    })

    // Mock: Failed to create a company due to missing SEGMENT_UNIQUE_IDENTIFIER property
    nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/companies').reply(400, {
      status: 'error',
      message:
        'Property values were not valid: [{"isValid":false,"message":"Property \\"segment_group_id\\" does not exist","error":"PROPERTY_DOESNT_EXIST","name":"segment_group_id"}]',
      correlationId: 'ef6f8b25-6ef2-47d3-ba8e-8eeb04a92045',
      category: 'VALIDATION_ERROR'
    })

    // Mock: Create SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/properties/companies')
      .reply(201, {
        updatedAt: '2022-10-15T06:05:51.599Z',
        createdAt: '2022-10-13T17:54:25.029Z',
        name: SEGMENT_UNIQUE_IDENTIFIER,
        label: 'Segment Group ID',
        type: 'string',
        fieldType: 'text',
        description: 'Unique Property to map Segment Group ID with a HubSpot Company Object',
        groupName: 'companyinformation',
        options: [],
        createdUserId: '1000000',
        updatedUserId: '1000000',
        displayOrder: -1,
        calculated: false,
        externalOptions: false,
        archived: false,
        hasUniqueValue: true,
        hidden: true,
        modificationMetadata: {
          archivable: true,
          readOnlyDefinition: false,
          readOnlyValue: false
        },
        formField: false
      })

    // Mock: Retry to Create a company
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/objects/companies')
      .reply(201, {
        id: hubspotGeneratedCompanyID,
        properties: {
          createdAt: '2022-10-13T17:54:25.029Z',
          hs_all_owner_ids: '100000000',
          hs_created_by_user_id: '1000000',
          hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
          hs_object_id: hubspotGeneratedCompanyID,
          hs_pipeline: 'companies-lifecycle-pipeline',
          hs_updated_by_user_id: '1000000',
          hs_user_ids_of_all_owners: '1000000',
          hubspot_owner_assigneddate: '2022-09-25T19:56:33.914Z',
          hubspot_owner_id: '1000000',
          lifecyclestage: 'lead',
          name: event?.traits?.name,
          domain: event?.traits?.website,
          website: event?.traits?.website
        },
        updatedAt: '2022-10-15T06:05:51.599Z',
        createdAt: '2022-10-13T17:54:25.029Z',
        archived: false
      })

    // Mock: Associate a contact with company
    nock(HUBSPOT_BASE_URL)
      .put(
        `/crm/v3/objects/companies/${hubspotGeneratedCompanyID}/associations/contacts/${contactId}/${ASSOCIATION_TYPE}`
      )
      .reply(200, {
        id: '100000000',
        properties: {
          createdate: '2022-09-25T19:56:33.914Z',
          hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
          hs_object_id: '100000000'
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false,
        associations: {
          contacts: {
            results: [
              {
                id: contactId,
                type: ASSOCIATION_TYPE
              },
              {
                id: contactId,
                type: `${ASSOCIATION_TYPE}_unlabeled`
              }
            ]
          }
        }
      })

    const responses = await testDestination.testAction('upsertCompany', {
      event,
      mapping: {
        ...defaultGroupMapping,
        companysearchfields: {
          domain: {
            '@path': '$.traits.website'
          }
        }
      },
      transactionContext: {
        transaction: {
          contact_id: contactId
        },
        setTransaction
      }
    })

    expect(responses[0].status).toEqual(404)
    expect(responses[1].status).toEqual(200)
    expect(responses[2].status).toEqual(400)
    expect(responses[3].status).toEqual(201)
    expect(responses[4].status).toEqual(201)
    expect(responses[5].status).toEqual(200)
  })

  it('should create SEGMENT_UNIQUE_IDENTIFIER and update a company if SEGMENT_UNIQUE_IDENTIFIER property is not found', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const contactId = '123456789'
    const hubspotGeneratedCompanyID = '1000000000'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company with Company Search Fields
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/objects/companies/search')
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedCompanyID,
            properties: {
              createdate: '2022-09-25T19:56:33.914Z',
              domain: 'test-company.com',
              hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCompanyID,
              name: 'Test Company',
              segment_group_id: null
            },
            createdAt: '2022-09-25T19:56:33.914Z',
            updatedAt: '2022-10-14T13:19:08.067Z',
            archived: false
          }
        ]
      })

    // Mock: Failed to update company due to missing SEGMENT_UNIQUE_IDENTIFIER property
    nock(HUBSPOT_BASE_URL).patch(`/crm/v3/objects/companies/${hubspotGeneratedCompanyID}`).reply(400, {
      status: 'error',
      message:
        'Property values were not valid: [{"isValid":false,"message":"Property \\"segment_group_id\\" does not exist","error":"PROPERTY_DOESNT_EXIST","name":"segment_group_id"}]',
      correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000',
      category: 'VALIDATION_ERROR'
    })

    // Mock: Create SEGMENT_UNIQUE_IDENTIFIER property
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/properties/companies')
      .reply(201, {
        updatedAt: '2022-10-15T06:05:51.599Z',
        createdAt: '2022-10-13T17:54:25.029Z',
        name: SEGMENT_UNIQUE_IDENTIFIER,
        label: 'Segment Group ID',
        type: 'string',
        fieldType: 'text',
        description: 'Unique Property to map Segment Group ID with a HubSpot Company Object',
        groupName: 'companyinformation',
        options: [],
        createdUserId: '1000000',
        updatedUserId: '1000000',
        displayOrder: -1,
        calculated: false,
        externalOptions: false,
        archived: false,
        hasUniqueValue: true,
        hidden: true,
        modificationMetadata: {
          archivable: true,
          readOnlyDefinition: false,
          readOnlyValue: false
        },
        formField: false
      })

    // Mock: Retry to update company
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${hubspotGeneratedCompanyID}`)
      .reply(200, {
        id: hubspotGeneratedCompanyID,
        properties: {
          createdAt: '2022-10-13T17:54:25.029Z',
          hs_all_owner_ids: '100000000',
          hs_created_by_user_id: '1000000',
          hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
          hs_object_id: hubspotGeneratedCompanyID,
          hs_pipeline: 'companies-lifecycle-pipeline',
          hs_updated_by_user_id: '1000000',
          hs_user_ids_of_all_owners: '1000000',
          hubspot_owner_assigneddate: '2022-09-25T19:56:33.914Z',
          hubspot_owner_id: '1000000',
          lifecyclestage: 'lead',
          name: event?.traits?.name,
          domain: event?.traits?.website,
          website: event?.traits?.website
        },
        updatedAt: '2022-10-15T06:05:51.599Z',
        createdAt: '2022-10-13T17:54:25.029Z',
        archived: false
      })

    // Mock: Associate a contact with company
    nock(HUBSPOT_BASE_URL)
      .put(
        `/crm/v3/objects/companies/${hubspotGeneratedCompanyID}/associations/contacts/${contactId}/${ASSOCIATION_TYPE}`
      )
      .reply(200, {
        id: '100000000',
        properties: {
          createdate: '2022-09-25T19:56:33.914Z',
          hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
          hs_object_id: '100000000'
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false,
        associations: {
          contacts: {
            results: [
              {
                id: contactId,
                type: ASSOCIATION_TYPE
              },
              {
                id: contactId,
                type: `${ASSOCIATION_TYPE}_unlabeled`
              }
            ]
          }
        }
      })

    const responses = await testDestination.testAction('upsertCompany', {
      event,
      mapping: {
        ...defaultGroupMapping,
        companysearchfields: {
          domain: {
            '@path': '$.traits.website'
          }
        }
      },
      transactionContext: {
        transaction: {
          contact_id: contactId
        },
        setTransaction
      }
    })

    expect(responses[0].status).toEqual(404)
    expect(responses[1].status).toEqual(200)
    expect(responses[2].status).toEqual(400)
    expect(responses[3].status).toEqual(201)
    expect(responses[4].status).toEqual(200)
  })

  it('should throw an error if SEGMENT_UNIQUE_IDENTIFIER is defined in options', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          },
          properties: {
            [SEGMENT_UNIQUE_IDENTIFIER]: {
              '@path': '$.groupId'
            }
          }
        }
      })
    ).rejects.toThrowError(RestrictedPropertyThrowableError)
  })

  it('should throw an error if transactionContext is undefined', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          }
        }
      })
    ).rejects.toThrowError(MissingIdentityCallThrowableError)
  })

  it('should throw an error if updateCompany returns errors other than 404 and SEGMENT_UNIQUE_IDENTIFIER', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const errorResponse = {
      status: 'error',
      message: 'Internal Server Error',
      correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000',
      category: 'VALIDATION_ERROR'
    }

    const contactId = '123456789'

    // Mock: Failed to search update company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(500, { ...errorResponse })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          }
        },
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
      })
    ).rejects.toMatchObject({
      response: {
        status: 500,
        data: errorResponse
      }
    })
  })

  it('should throw an error if multiple companies are returned by search criteria', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const contactId = '123456789'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company with Company Search Fields
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/objects/companies/search')
      .reply(200, {
        total: 2,
        results: [
          {
            id: 1000000000,
            properties: {
              createdate: '2022-09-25T19:56:33.914Z',
              domain: 'test-company.com',
              hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
              hs_object_id: 1000000000,
              name: 'Test Company',
              segment_group_id: null
            },
            createdAt: '2022-09-25T19:56:33.914Z',
            updatedAt: '2022-10-14T13:19:08.067Z',
            archived: false
          },
          {
            id: 1000000001,
            properties: {
              createdate: '2022-09-25T19:56:33.914Z',
              domain: 'test-company.com',
              hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
              hs_object_id: 1000000001,
              name: 'Test Company',
              segment_group_id: null
            },
            createdAt: '2022-09-25T19:56:33.914Z',
            updatedAt: '2022-10-14T13:19:08.067Z',
            archived: false
          }
        ]
      })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          }
        },
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
      })
    ).rejects.toThrowError(MultipleCompaniesInSearchResultThrowableError)
  })

  it('should throw an error if company Search Field has an undefined property', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const contactId = '123456789'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company with Company Search Fields
    nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/companies/search').reply(400, {
      status: 'error',
      message: 'There was a problem with the request.',
      correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
    })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            undefined_field: {
              '@path': '$.traits.website'
            }
          }
        },
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
      })
    ).rejects.toThrowError(CompanySearchThrowableError)
  })

  it('should throw an error if a company search returns errors other than 400', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const errorResponse = {
      status: 'error',
      message: 'Internal Server Error',
      correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000',
      category: 'VALIDATION_ERROR'
    }

    const contactId = '123456789'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company with Company Search Fields
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/objects/companies/search')
      .reply(500, { ...errorResponse })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          }
        },
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
      })
    ).rejects.toMatchObject({
      response: {
        status: 500,
        data: errorResponse
      }
    })
  })

  it('should throw an error if createCompany returns an unexpected HTTP error', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const errorResponse = {
      status: 'error',
      message: 'Internal Server Error',
      correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000',
      category: 'VALIDATION_ERROR'
    }

    const contactId = '123456789'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company returned no results
    nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/companies/search').reply(200, {
      total: 0,
      results: []
    })

    // Mock: Failed to create a company due to an unknown error
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/objects/companies')
      .reply(500, {
        ...errorResponse
      })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          }
        },
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
      })
    ).rejects.toMatchObject({
      response: {
        status: 500,
        data: errorResponse
      }
    })
  })

  it('should throw an error if updateCompany returns an unexpected HTTP error', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const errorResponse = {
      status: 'error',
      message: 'Internal Server Error',
      correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000',
      category: 'VALIDATION_ERROR'
    }

    const contactId = '123456789'
    const hubspotGeneratedCompanyID = '1000000000'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company with Company Search Fields
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/objects/companies/search')
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedCompanyID,
            properties: {
              createdate: '2022-09-25T19:56:33.914Z',
              domain: 'test-company.com',
              hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCompanyID,
              name: 'Test Company',
              segment_group_id: null
            },
            createdAt: '2022-09-25T19:56:33.914Z',
            updatedAt: '2022-10-14T13:19:08.067Z',
            archived: false
          }
        ]
      })

    // Mock: Failed to update a company due to an unknown error
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${hubspotGeneratedCompanyID}`)
      .reply(500, {
        ...errorResponse
      })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          }
        },
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
      })
    ).rejects.toMatchObject({
      response: {
        status: 500,
        data: errorResponse
      }
    })
  })

  it('should throw an error if SEGMENT_UNIQUE_IDENTIFIER property in createCompany returns an unexpected HTTP error', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const errorResponse = {
      status: 'error',
      message: 'Internal Server Error',
      correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000',
      category: 'VALIDATION_ERROR'
    }

    const contactId = '123456789'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company returned no results
    nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/companies/search').reply(200, {
      total: 0,
      results: []
    })

    // Mock: Failed to create a company due to an unknown error
    nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/companies').reply(400, {
      status: 'error',
      message:
        'Property values were not valid: [{"isValid":false,"message":"Property \\"segment_group_id\\" does not exist","error":"PROPERTY_DOESNT_EXIST","name":"segment_group_id"}]',
      correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000',
      category: 'VALIDATION_ERROR'
    })

    // Mock: Create SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/properties/companies')
      .reply(500, {
        ...errorResponse
      })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          }
        },
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
      })
    ).rejects.toMatchObject({
      response: {
        status: 500,
        data: errorResponse
      }
    })
  })

  it('should throw an error if SEGMENT_UNIQUE_IDENTIFIER property in updateCompany returns an unexpected HTTP error', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const errorResponse = {
      status: 'error',
      message: 'Internal Server Error',
      correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000',
      category: 'VALIDATION_ERROR'
    }

    const contactId = '123456789'
    const hubspotGeneratedCompanyID = '1000000000'

    // Mock: Failed to search company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000'
      })

    // Mock: Search company with Company Search Fields
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/objects/companies/search')
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedCompanyID,
            properties: {
              createdate: '2022-09-25T19:56:33.914Z',
              domain: 'test-company.com',
              hs_lastmodifieddate: '2022-10-14T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCompanyID,
              name: 'Test Company',
              segment_group_id: null
            },
            createdAt: '2022-09-25T19:56:33.914Z',
            updatedAt: '2022-10-14T13:19:08.067Z',
            archived: false
          }
        ]
      })

    // Mock: Failed to update company due to missing SEGMENT_UNIQUE_IDENTIFIER property
    nock(HUBSPOT_BASE_URL).patch(`/crm/v3/objects/companies/${hubspotGeneratedCompanyID}`).reply(400, {
      status: 'error',
      message:
        'Property values were not valid: [{"isValid":false,"message":"Property \\"segment_group_id\\" does not exist","error":"PROPERTY_DOESNT_EXIST","name":"segment_group_id"}]',
      correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000',
      category: 'VALIDATION_ERROR'
    })

    // Mock: Create SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/properties/companies')
      .reply(500, {
        ...errorResponse
      })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          }
        },
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
      })
    ).rejects.toMatchObject({
      response: {
        status: 500,
        data: errorResponse
      }
    })
  })

  // Special Case: If a company already has a SEGMENT_UNIQUE_IDENTIFIER property value, but the property is later deleted from HubSpot
  // the search would still find the correct company, but the update would fail with a 400 error stating property doesn't exist
  // Segment will attempt to create the SEGMENT_UNIQUE_IDENTIFIER property and throw a retryable error to Centrifuge
  it('should throw retryable error for SEGMENT_UNIQUE_IDENTIFIER Special Case', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Company',
        website: 'test-company.com'
      },
      groupId: 'test-group-id'
    })

    const contactId = '123456789'

    // Mock: Failed to search update company with SEGMENT_UNIQUE_IDENTIFIER
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/companies/${event.groupId}?idProperty=${SEGMENT_UNIQUE_IDENTIFIER}`)
      .reply(400, {
        status: 'error',
        message:
          'Property values were not valid: [{"isValid":false,"message":"Property \\"segment_group_id\\" does not exist","error":"PROPERTY_DOESNT_EXIST","name":"segment_group_id"}]',
        correlationId: 'aabbcc5b01-c9c7-4000-9191-000000000000',
        category: 'VALIDATION_ERROR'
      })

    // Mock: Create SEGMENT_UNIQUE_IDENTIFIER property for company
    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/properties/companies')
      .reply(201, {
        updatedAt: '2022-10-14T20:04:48.613Z',
        createdAt: '2022-10-13T17:54:25.029Z',
        name: 'segment_group_id',
        label: 'Segment Group ID',
        type: 'string',
        fieldType: 'text',
        description: 'Unique Property to map Segment Group ID with a HubSpot Company Object',
        groupName: 'companyinformation',
        options: [],
        createdUserId: '1000000',
        updatedUserId: '1000000',
        displayOrder: -1,
        calculated: false,
        externalOptions: false,
        archived: false,
        hasUniqueValue: true,
        hidden: true,
        modificationMetadata: {
          archivable: true,
          readOnlyDefinition: false,
          readOnlyValue: false
        },
        formField: false
      })

    await expect(
      testDestination.testAction('upsertCompany', {
        event,
        mapping: {
          ...defaultGroupMapping,
          companysearchfields: {
            domain: {
              '@path': '$.traits.website'
            }
          }
        },
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
      })
    ).rejects.toThrowError(SegmentUniqueIdentifierMissingRetryableError)
  })
})
