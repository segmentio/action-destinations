import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { DynamicFieldResponse } from '@segment/actions-core'
import { HUBSPOT_BASE_URL } from '../../properties'

const endpoint = `${HUBSPOT_BASE_URL}/crm/v3/objects`

let testDestination = createTestIntegration(Destination)

beforeEach((done) => {
  // Re-Initialize the destination before each test
  // This is done to mitigate a bug where action responses persist into other tests
  testDestination = createTestIntegration(Destination)
  nock.cleanAll()
  done()
})

describe('HubSpot.upsertCustomObjectRecord', () => {
  // Validate creation of custom object with fullyQualifiedName of a HubSpot Schema
  it('should create a Custom Object with fullyQualifiedName of a Schema', async () => {
    nock(endpoint)
      .post(/.*/)
      .reply(201, {
        id: '1234567890',
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
        objectType: 'p11223344_discount',
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

    expect(responses[0].status).toBe(201)
  })

  it('should dynamically fetch custom object name', async () => {
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
    const payload = {}
    const responses = (await testDestination.executeDynamicField('upsertCustomObjectRecord', 'objectType', {
      payload: payload,
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
})
