import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { DynamicFieldResponse } from '@segment/actions-core'
import { HUBSPOT_BASE_URL } from '../../properties'
import {
  MultipleCustomRecordsInSearchResultThrowableError,
  MultipleCustomRecordsInSearchResultToAssociateThrowableError
} from '../../errors'

const endpoint = `${HUBSPOT_BASE_URL}/crm/v3/objects`

let testDestination = createTestIntegration(Destination)
const objectType = 'p11223344_discount'
const toObjectType = 'p44332211_shopping'
const hubspotGeneratedCustomObjectRecordId = '1234567890'
const hubspotGeneratedAssociateCustomObjectRecordId = '9876543321'

beforeEach((done) => {
  // Re-Initialize the destination before each test
  // This is done to mitigate a bug where action responses persist into other tests
  testDestination = createTestIntegration(Destination)
  nock.cleanAll()
  done()
})

describe('HubSpot.upsertCustomObjectRecord', () => {
  it('should update a custom Object with custom Search Field, if record matches', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%'
      }
    })

    // Mock: Search Custom Object Record with custom Search Fields
    nock(HUBSPOT_BASE_URL)
      .post(`/crm/v3/objects/${objectType}/search`)
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedCustomObjectRecordId,
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCustomObjectRecordId,
              test: 'new_test_value',
              test_custom_object_type: 'new_test_custom_object_type'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          }
        ]
      })

    // Mock: Update a custom object record  with record ID
    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/${objectType}/${hubspotGeneratedCustomObjectRecordId}`)
      .reply(200, {
        id: hubspotGeneratedCustomObjectRecordId,
        properties: {
          createdate: '2023-06-01T19:56:33.914Z',
          hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
          hs_object_id: hubspotGeneratedCustomObjectRecordId,
          test: 'new_test_value',
          test_custom_object_type: 'new_test_custom_object_type'
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false
      })

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
      event,
      mapping: {
        objectType: objectType,
        createNewCustomRecord: true,
        customObjectSearchFields: {
          test_custom_object_type: 'new_test_custom_object_type'
        },
        properties: {
          coupon_code: {
            '@path': '$.properties.couponCode'
          },
          discount_percent: {
            '@path': '$.properties.couponCode'
          }
        }
      }
    })
    expect(responses).toHaveLength(2)
    expect(responses[0].status).toEqual(200)
    expect(responses[0].options.json).toMatchSnapshot()
    expect(responses[1].status).toEqual(200)
    expect(responses[1].options.json).toMatchSnapshot()
  })

  it("should create a Custom Object when create new custom object flag is true and record doesn't match", async () => {
    // Mock: Search Custom Object Record with custom Search Fields
    nock(HUBSPOT_BASE_URL).post(`/crm/v3/objects/${objectType}/search`).reply(200, {
      total: 0,
      results: []
    })
    nock(endpoint)
      .post(`/${objectType}`)
      .reply(201, {
        id: hubspotGeneratedCustomObjectRecordId,
        properties: {
          coupon_code: 'TEST1234',
          discount_percent: '10%',
          hs_createdate: '2022-09-28T10:50:29.120Z',
          hs_lastmodifieddate: '2022-09-28T10:50:29.120Z',
          hs_object_id: '2963526473'
        },
        createdAt: '2022-09-28T10:50:29.120Z',
        updatedAt: '2022-09-28T10:50:29.120Z',
        archived: false
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%'
      }
    })

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
      event,
      mapping: {
        objectType: objectType,
        createNewCustomRecord: true,
        customObjectSearchFields: {
          test_custom_object_type: 'new_test_custom_object_type'
        },
        properties: {
          coupon_code: {
            '@path': '$.properties.couponCode'
          },
          discount_percent: {
            '@path': '$.properties.couponCode'
          }
        }
      }
    })
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(201)
  })

  it("should skip creation of a Custom Object when create new custom object flag is false and record doesn't match", async () => {
    // Mock: Search Custom Object Record with custom Search Fields
    nock(HUBSPOT_BASE_URL).post(`/crm/v3/objects/${objectType}/search`).reply(200, {
      total: 0,
      results: []
    })

    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%'
      }
    })

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
      event,
      mapping: {
        objectType: objectType,
        createNewCustomRecord: false,
        customObjectSearchFields: {
          test_custom_object_type: 'new_test_custom_object_type'
        },
        properties: {
          coupon_code: {
            '@path': '$.properties.couponCode'
          },
          discount_percent: {
            '@path': '$.properties.couponCode'
          }
        }
      }
    })
    expect(responses).toHaveLength(1)
    expect(responses[0].status).toBe(200)
  })

  it('should throw an error when custom object search returns multiple records', async () => {
    // Mock: Search Custom Object Record with custom Search Fields
    nock(HUBSPOT_BASE_URL)
      .post(`/crm/v3/objects/${objectType}/search`)
      .reply(200, {
        total: 2,
        results: [
          {
            id: hubspotGeneratedCustomObjectRecordId,
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCustomObjectRecordId,
              test: 'new_test_value',
              test_custom_object_type: 'new_test_custom_object_type'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          },
          {
            id: '12349876',
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCustomObjectRecordId,
              test: 'new_test_value',
              test_custom_object_type: 'new_test_custom_object_type_1'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          }
        ]
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%'
      }
    })

    await expect(
      testDestination.testAction('upsertCustomObjectRecord', {
        event,
        mapping: {
          objectType: objectType,
          createNewCustomRecord: true,
          customObjectSearchFields: {
            test: 'new_test_value'
          },
          properties: {
            coupon_code: {
              '@path': '$.properties.couponCode'
            },
            discount_percent: {
              '@path': '$.properties.couponCode'
            }
          }
        }
      })
    ).rejects.toThrowError(MultipleCustomRecordsInSearchResultThrowableError)
  })

  it('should dynamically fetch custom objectType', async () => {
    nock(HUBSPOT_BASE_URL)
      .get(`/crm/v3/schemas?archived=false`)
      .reply(200, {
        results: [
          {
            labels: {
              singular: 'Car',
              plural: 'Cars'
            },
            fullyQualifiedName: 'p22596207_car',
            createdAt: '2022-09-02T06:37:55.855Z',
            updatedAt: '2022-09-02T07:04:56.159Z',
            objectTypeId: '2-8594192',
            properties: [
              {
                updatedAt: '2022-09-02T06:37:55.966Z',
                createdAt: '2022-09-02T06:37:55.966Z',
                name: 'color',
                label: 'Color',
                type: 'string',
                fieldType: 'text',
                description: '',
                groupName: 'car_information',
                options: [],
                createdUserId: '1058338',
                updatedUserId: '1058338',
                displayOrder: -1,
                calculated: false,
                externalOptions: false,
                archived: false,
                hasUniqueValue: false,
                hidden: false,
                modificationMetadata: {
                  archivable: true,
                  readOnlyDefinition: false,
                  readOnlyValue: false
                },
                formField: false
              }
            ],
            name: 'car'
          },
          {
            labels: {
              singular: 'ServiceRequest',
              plural: 'ServiceRequests'
            },
            fullyQualifiedName: 'p22596207_service_request',
            createdAt: '2022-09-05T08:16:13.083Z',
            updatedAt: '2022-09-05T08:16:13.083Z',
            objectTypeId: '2-8648833',
            properties: [
              {
                updatedAt: '2022-09-05T08:16:13.214Z',
                createdAt: '2022-09-05T08:16:13.214Z',
                name: 'customer_id',
                label: 'Unique ID for a customer',
                type: 'string',
                fieldType: 'text',
                description: '',
                groupName: 'service_request_information',
                options: [],
                createdUserId: '1058338',
                updatedUserId: '1058338',
                displayOrder: -1,
                calculated: false,
                externalOptions: false,
                archived: false,
                hasUniqueValue: false,
                hidden: false,
                modificationMetadata: {
                  archivable: true,
                  readOnlyDefinition: false,
                  readOnlyValue: false
                },
                formField: true
              }
            ],
            name: 'service_request'
          }
        ]
      })

    //Dynamically Fetch objectType
    const responses = (await testDestination.executeDynamicField('upsertCustomObjectRecord', 'objectType', {
      payload: {},
      settings: {}
    })) as DynamicFieldResponse

    expect(responses.choices.length).toBe(4)
    expect(responses.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Cars',
          value: 'p22596207_car'
        }),
        expect.objectContaining({
          label: 'ServiceRequests',
          value: 'p22596207_service_request'
        }),
        expect.objectContaining({
          label: 'Deals',
          value: 'deals'
        }),
        expect.objectContaining({
          label: 'Tickets',
          value: 'tickets'
        })
      ])
    )
  })

  it('should dynamically fetch toObjectType', async () => {
    nock(HUBSPOT_BASE_URL)
      .get(`/crm/v3/schemas?archived=false`)
      .reply(200, {
        results: [
          {
            labels: {
              singular: 'Car',
              plural: 'Cars'
            },
            fullyQualifiedName: 'p22596207_car',
            createdAt: '2022-09-02T06:37:55.855Z',
            updatedAt: '2022-09-02T07:04:56.159Z',
            objectTypeId: '2-8594192',
            properties: [
              {
                updatedAt: '2022-09-02T06:37:55.966Z',
                createdAt: '2022-09-02T06:37:55.966Z',
                name: 'color',
                label: 'Color',
                type: 'string',
                fieldType: 'text',
                description: '',
                groupName: 'car_information',
                options: [],
                createdUserId: '1058338',
                updatedUserId: '1058338',
                displayOrder: -1,
                calculated: false,
                externalOptions: false,
                archived: false,
                hasUniqueValue: false,
                hidden: false,
                modificationMetadata: {
                  archivable: true,
                  readOnlyDefinition: false,
                  readOnlyValue: false
                },
                formField: false
              }
            ],
            name: 'car'
          },
          {
            labels: {
              singular: 'ServiceRequest',
              plural: 'ServiceRequests'
            },
            fullyQualifiedName: 'p22596207_service_request',
            createdAt: '2022-09-05T08:16:13.083Z',
            updatedAt: '2022-09-05T08:16:13.083Z',
            objectTypeId: '2-8648833',
            properties: [
              {
                updatedAt: '2022-09-05T08:16:13.214Z',
                createdAt: '2022-09-05T08:16:13.214Z',
                name: 'customer_id',
                label: 'Unique ID for a customer',
                type: 'string',
                fieldType: 'text',
                description: '',
                groupName: 'service_request_information',
                options: [],
                createdUserId: '1058338',
                updatedUserId: '1058338',
                displayOrder: -1,
                calculated: false,
                externalOptions: false,
                archived: false,
                hasUniqueValue: false,
                hidden: false,
                modificationMetadata: {
                  archivable: true,
                  readOnlyDefinition: false,
                  readOnlyValue: false
                },
                formField: true
              }
            ],
            name: 'service_request'
          }
        ]
      })

    //Dynamically Fetch toObjectType
    const toObjectTypeResponses = (await testDestination.executeDynamicField(
      'upsertCustomObjectRecord',
      'toObjectType',
      {
        payload: {},
        settings: {}
      }
    )) as DynamicFieldResponse

    expect(toObjectTypeResponses.choices.length).toBe(6)
    expect(toObjectTypeResponses.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Cars',
          value: 'p22596207_car'
        }),
        expect.objectContaining({
          label: 'ServiceRequests',
          value: 'p22596207_service_request'
        }),
        expect.objectContaining({
          label: 'Deals',
          value: 'deals'
        }),
        expect.objectContaining({
          label: 'Tickets',
          value: 'tickets'
        }),
        expect.objectContaining({
          label: 'Contacts',
          value: 'contacts'
        }),
        expect.objectContaining({
          label: 'Companies',
          value: 'companies'
        })
      ])
    )
  })
  it('should dynamically fetch association labels between objectType and toObjectType', async () => {
    nock(HUBSPOT_BASE_URL)
      .get(`/crm/v4/associations/${objectType}/${toObjectType}/labels`)
      .reply(200, {
        results: [
          {
            category: 'HUBSPOT_DEFINED',
            typeId: 279,
            label: null
          },
          {
            category: 'HUBSPOT_DEFINED',
            typeId: 1,
            label: 'Primary'
          }
        ]
      })

    //Dynamically Fetch association Labels between objectType and toObjectType
    const payload = {
      objectType: objectType,
      toObjectType: toObjectType
    }
    const responses = (await testDestination.executeDynamicField('upsertCustomObjectRecord', 'associationLabel', {
      payload: payload,
      settings: {}
    })) as DynamicFieldResponse

    expect(responses.choices.length).toBe(2)
    expect(responses.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Unlabeled Association (Type 279)',
          value: 'HUBSPOT_DEFINED:279'
        }),
        expect.objectContaining({
          label: 'Primary',
          value: 'HUBSPOT_DEFINED:1'
        })
      ])
    )
  })

  it('should return error message and code if dynamic fetch fails', async () => {
    const errorResponse = {
      status: 'error',
      message: 'Unable to fetch schemas',
      correlationId: 'da20ed7c-1834-43c8-8d29-c8f65c411bc2',
      category: 'INVALID_AUTHENTICATION'
    }
    nock(HUBSPOT_BASE_URL).get(`/crm/v3/schemas?archived=false`).reply(400, errorResponse)
    const payload = {}
    const responses = (await testDestination.executeDynamicField('upsertCustomObjectRecord', 'objectType', {
      payload: payload,
      settings: {}
    })) as DynamicFieldResponse

    expect(responses.choices.length).toBe(0)
    expect(responses.error?.message).toEqual(errorResponse.message)
    expect(responses.error?.code).toEqual(errorResponse.category)
  })

  it('should handle flattening of objects', async () => {
    nock(endpoint).post(/.*/).reply(201, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%',
        customPropertyOne: [1, 2, 3, 4, 5],
        customPropertyTwo: {
          a: 1,
          b: 2,
          c: 3
        },
        customPropertyThree: [1, 'two', true, { four: 4 }]
      }
    })

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
      event,
      mapping: {
        objectType: 'p11223344_discount',
        createNewCustomRecord: true,
        properties: {
          coupon_code: {
            '@path': '$.properties.couponCode'
          },
          discount_percent: {
            '@path': '$.properties.couponCode'
          },
          custom_property_1: {
            '@path': '$.properties.customPropertyOne'
          },
          custom_property_2: {
            '@path': '$.properties.customPropertyTwo'
          },
          custom_property_3: {
            '@path': '$.properties.customPropertyThree'
          }
        }
      }
    })

    expect(responses).toHaveLength(1)
    expect(responses[0].options.json).toMatchObject({
      properties: {
        custom_property_1: '1;2;3;4;5',
        custom_property_2: '{"a":1,"b":2,"c":3}',
        custom_property_3: '1;two;true;{"four":4}'
      }
    })
  })

  it('should create a custom object record and associate with another record on the basis of provided search field to associate', async () => {
    // Mock: Search Custom Object Record with custom Search Fields
    nock(HUBSPOT_BASE_URL).post(`/crm/v3/objects/${objectType}/search`).reply(200, {
      total: 0,
      results: []
    })
    nock(HUBSPOT_BASE_URL)
      .post(`/crm/v3/objects/${toObjectType}/search`)
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedCustomObjectRecordId,
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCustomObjectRecordId,
              shopping_code: 'test_1234'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          }
        ]
      })
    nock(endpoint)
      .post(`/${objectType}`)
      .reply(201, {
        id: hubspotGeneratedCustomObjectRecordId,
        properties: {
          coupon_code: 'TEST1234',
          discount_percent: '10%',
          hs_createdate: '2022-09-28T10:50:29.120Z',
          hs_lastmodifieddate: '2022-09-28T10:50:29.120Z',
          hs_object_id: '2963526473'
        },
        createdAt: '2022-09-28T10:50:29.120Z',
        updatedAt: '2022-09-28T10:50:29.120Z',
        archived: false
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%'
      }
    })

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
      event,
      mapping: {
        objectType: objectType,
        toObjectType: toObjectType,
        createNewCustomRecord: true,
        customObjectSearchFields: {
          test_custom_object_type: 'new_test_custom_object_type'
        },
        searchFieldsToAssociateCustomObjects: {
          shopping_code: 'test_1234'
        },
        associationLabel: 'HUBSPOT_DEFINED:279',
        properties: {
          coupon_code: {
            '@path': '$.properties.couponCode'
          },
          discount_percent: {
            '@path': '$.properties.couponCode'
          }
        }
      }
    })
    expect(responses).toHaveLength(3)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
    expect(responses[2].status).toBe(201)
    expect(responses[2].options.json).toMatchSnapshot()
  })

  it('should update a custom object record and associate with another record when both search field matches a unique record', async () => {
    // Mock: Search Custom Object Record with custom Search Fields
    nock(HUBSPOT_BASE_URL)
      .post(`/crm/v3/objects/${objectType}/search`)
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedCustomObjectRecordId,
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCustomObjectRecordId,
              test: 'new_test_value',
              test_custom_object_type: 'new_test_custom_object_type'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          }
        ]
      })

    nock(HUBSPOT_BASE_URL)
      .post(`/crm/v3/objects/${toObjectType}/search`)
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedAssociateCustomObjectRecordId,
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: hubspotGeneratedAssociateCustomObjectRecordId,
              shopping_code: 'test_1234'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          }
        ]
      })

    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/${objectType}/${hubspotGeneratedCustomObjectRecordId}`)
      .reply(200, {
        id: hubspotGeneratedCustomObjectRecordId,
        properties: {
          createdate: '2023-06-01T19:56:33.914Z',
          hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
          hs_object_id: hubspotGeneratedCustomObjectRecordId,
          test: 'new_test_value',
          test_custom_object_type: 'new_test_custom_object_type'
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false
      })

    nock(HUBSPOT_BASE_URL)
      .put(
        `/crm/v4/objects/${objectType}/${hubspotGeneratedCustomObjectRecordId}/associations/${toObjectType}/${hubspotGeneratedAssociateCustomObjectRecordId}`
      )
      .reply(201, {
        fromObjectTypeId: '2-1624200563',
        fromObjectId: hubspotGeneratedCustomObjectRecordId,
        toObjectTypeId: '2-1624100564',
        toObjectId: hubspotGeneratedAssociateCustomObjectRecordId,
        labels: ['shopping_discount']
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%'
      }
    })

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
      event,
      mapping: {
        objectType: objectType,
        toObjectType: toObjectType,
        createNewCustomRecord: true,
        customObjectSearchFields: {
          test_custom_object_type: 'new_test_custom_object_type'
        },
        searchFieldsToAssociateCustomObjects: {
          shopping_code: 'test_1234'
        },
        associationLabel: 'HUBSPOT_DEFINED:279',
        properties: {
          coupon_code: {
            '@path': '$.properties.couponCode'
          },
          discount_percent: {
            '@path': '$.properties.couponCode'
          }
        }
      }
    })
    expect(responses).toHaveLength(4)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
    expect(responses[2].status).toBe(200)
    expect(responses[2].options.json).toMatchSnapshot()
    expect(responses[3].status).toBe(201)
    expect(responses[3].options.json).toMatchSnapshot()
  })

  it("Should only Upsert Custom Object record and would skip association if anyone of 'toObjectType , associationLabel and searchFieldsToAssociateCustomObjects' is not provided", async () => {
    // Mock: Search Custom Object Record with custom Search Fields
    nock(HUBSPOT_BASE_URL)
      .post(`/crm/v3/objects/${objectType}/search`)
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedCustomObjectRecordId,
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCustomObjectRecordId,
              test: 'new_test_value',
              test_custom_object_type: 'new_test_custom_object_type'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          }
        ]
      })

    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/${objectType}/${hubspotGeneratedCustomObjectRecordId}`)
      .reply(200, {
        id: hubspotGeneratedCustomObjectRecordId,
        properties: {
          createdate: '2023-06-01T19:56:33.914Z',
          hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
          hs_object_id: hubspotGeneratedCustomObjectRecordId,
          test: 'new_test_value',
          test_custom_object_type: 'new_test_custom_object_type'
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%'
      }
    })

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
      event,
      mapping: {
        objectType: objectType,
        toObjectType: toObjectType,
        createNewCustomRecord: true,
        customObjectSearchFields: {
          test_custom_object_type: 'new_test_custom_object_type'
        },
        searchFieldsToAssociateCustomObjects: {
          shopping_code: 'test_1234'
        },
        properties: {
          coupon_code: {
            '@path': '$.properties.couponCode'
          },
          discount_percent: {
            '@path': '$.properties.couponCode'
          }
        }
      }
    })
    expect(responses).toHaveLength(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
    expect(responses[1].options.json).toMatchSnapshot()
  })

  it('Should only Upsert Custom Object and would skip association if no record found on the basis of search fields provided to associate', async () => {
    // Mock: Search Custom Object Record with custom Search Fields
    nock(HUBSPOT_BASE_URL)
      .post(`/crm/v3/objects/${objectType}/search`)
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedCustomObjectRecordId,
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCustomObjectRecordId,
              test: 'new_test_value',
              test_custom_object_type: 'new_test_custom_object_type'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          }
        ]
      })
    nock(HUBSPOT_BASE_URL).post(`/crm/v3/objects/${toObjectType}/search`).reply(200, {
      total: 0,
      results: []
    })

    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/${objectType}/${hubspotGeneratedCustomObjectRecordId}`)
      .reply(200, {
        id: hubspotGeneratedCustomObjectRecordId,
        properties: {
          createdate: '2023-06-01T19:56:33.914Z',
          hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
          hs_object_id: hubspotGeneratedCustomObjectRecordId,
          test: 'new_test_value',
          test_custom_object_type: 'new_test_custom_object_type'
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%'
      }
    })

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
      event,
      mapping: {
        objectType: objectType,
        toObjectType: toObjectType,
        createNewCustomRecord: true,
        customObjectSearchFields: {
          test_custom_object_type: 'new_test_custom_object_type'
        },
        searchFieldsToAssociateCustomObjects: {
          shopping_code: 'test_1234'
        },
        associationLabel: 'HUBSPOT_DEFINED:279',
        properties: {
          coupon_code: {
            '@path': '$.properties.couponCode'
          },
          discount_percent: {
            '@path': '$.properties.couponCode'
          }
        }
      }
    })
    expect(responses).toHaveLength(3)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
    expect(responses[2].status).toBe(200)
    expect(responses[2].options.json).toMatchSnapshot()
  })

  it('Should throw an error when association will fail due to search association object returned more than one items but Upsert custom object operation will be completed.', async () => {
    // Mock: Search Custom Object Record with custom Search Fields
    nock(HUBSPOT_BASE_URL)
      .post(`/crm/v3/objects/${objectType}/search`)
      .reply(200, {
        total: 1,
        results: [
          {
            id: hubspotGeneratedCustomObjectRecordId,
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: hubspotGeneratedCustomObjectRecordId,
              test: 'new_test_value',
              test_custom_object_type: 'new_test_custom_object_type'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          }
        ]
      })
    nock(HUBSPOT_BASE_URL)
      .post(`/crm/v3/objects/${toObjectType}/search`)
      .reply(200, {
        total: 2,
        results: [
          {
            id: hubspotGeneratedAssociateCustomObjectRecordId,
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: hubspotGeneratedAssociateCustomObjectRecordId,
              shopping_code: 'test_1234'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          },
          {
            id: `test-${hubspotGeneratedAssociateCustomObjectRecordId}`,
            properties: {
              createdate: '2023-06-01T19:56:33.914Z',
              hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
              hs_object_id: `test-${hubspotGeneratedAssociateCustomObjectRecordId}`,
              shopping_code: 'test_1234'
            },
            createdAt: '2023-06-01T19:56:33.914Z',
            updatedAt: '2023-06-01T13:19:08.067Z',
            archived: false
          }
        ]
      })

    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/${objectType}/${hubspotGeneratedCustomObjectRecordId}`)
      .reply(200, {
        id: hubspotGeneratedCustomObjectRecordId,
        properties: {
          createdate: '2023-06-01T19:56:33.914Z',
          hs_lastmodifieddate: '2023-06-01T13:19:08.067Z',
          hs_object_id: hubspotGeneratedCustomObjectRecordId,
          test: 'new_test_value',
          test_custom_object_type: 'new_test_custom_object_type'
        },
        createdAt: '2022-09-25T19:56:33.914Z',
        updatedAt: '2022-10-14T13:19:08.067Z',
        archived: false
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%'
      }
    })

    await expect(
      testDestination.testAction('upsertCustomObjectRecord', {
        event,
        mapping: {
          objectType: objectType,
          toObjectType: toObjectType,
          createNewCustomRecord: true,
          customObjectSearchFields: {
            test_custom_object_type: 'new_test_custom_object_type'
          },
          searchFieldsToAssociateCustomObjects: {
            shopping_code: 'test_1234'
          },
          associationLabel: 'HUBSPOT_DEFINED:279',
          properties: {
            coupon_code: {
              '@path': '$.properties.couponCode'
            },
            discount_percent: {
              '@path': '$.properties.couponCode'
            }
          }
        }
      })
    ).rejects.toThrowError(MultipleCustomRecordsInSearchResultToAssociateThrowableError)
  })
})
