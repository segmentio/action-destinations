import nock from 'nock'
import { createTestEvent, createTestIntegration, DynamicFieldResponse, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import destination from '../../index'
import { generateTestData } from '../../../../lib/test-data'

const actionSlug = 'upsertCatalogItem'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`
const receivedAt = '2021-08-03T17:40:04.055Z'

jest.setTimeout(30000000)

const settings = {
  app_id: 'my-app-id',
  api_key: 'my-api-key',
  endpoint: 'https://rest.iad-01.braze.com' as const
}
const testDestination = createTestIntegration(Destination)

describe('Braze.upsertCatalogItem', () => {
  it('Single event with upsert should work', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      settings: { ...settingsData, endpoint: settings.endpoint },
      mapping: { ...event.properties, __segment_internal_sync_mode: 'upsert' },
      auth: undefined
    })

    expect(responses[0].status).toBe(200)
  })
  it('single event with upsert should fail if there is no item object', async () => {
    const action = destination.actions[actionSlug]
    const [settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      event: 'Test Event 1',
      type: 'identify',
      receivedAt,
      properties: {
        id: 'car001',
        name: 'Model S',
        manufacturer: 'Tesla',
        price: 79999.99,
        discontinued: false,
        inception_date: '2012-06-22T04:00:00Z'
      }
    })

    try {
      await testDestination.testAction(actionSlug, {
        event: event,
        mapping: {
          catalog_name: 'cars',
          item_id: {
            '@path': '$.properties.id'
          },
          enable_batching: false,
          __segment_internal_sync_mode: 'upsert'
        },
        settings: { ...settingsData, endpoint: settings.endpoint },
        auth: undefined
      })
    } catch (error) {
      expect(error.code).toBe('PAYLOAD_VALIDATION_FAILED')
      expect(error.status).toBe(400)
    }
  })

  it('single event with delete should work', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().delete(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      settings: { ...settingsData, endpoint: settings.endpoint },
      mapping: { ...event.properties, __segment_internal_sync_mode: 'delete' },
      auth: undefined
    })

    expect(responses[0].status).toBe(200)
  })

  it('single event with delete should not throw error if item doesnt exist', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/)
      .persist()
      .delete(/.*/)
      .reply(400, {
        errors: [
          {
            id: 'item-not-found',
            message: 'Item not found',
            parameter_values: [eventData.id]
          }
        ]
      })

    const event = createTestEvent({
      properties: eventData
    })

    await testDestination.testAction(actionSlug, {
      event: event,
      settings: { ...settingsData, endpoint: settings.endpoint },
      mapping: { ...event.properties, __segment_internal_sync_mode: 'delete' },
      auth: undefined
    })

    expect(testDestination.results.at(-1)?.data?.status).toBe(200)
    expect(testDestination.results.at(-1)?.data?.message).toBe('Could not find item')
  })

  it('single event with invalid sync mode should fail', async () => {
    const action = destination.actions[actionSlug]
    const [settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      event: 'Test Event 1',
      type: 'identify',
      receivedAt,
      properties: {
        id: 'car001',
        name: 'Model S',
        manufacturer: 'Tesla',
        price: 79999.99,
        discontinued: false,
        inception_date: '2012-06-22T04:00:00Z'
      }
    })

    try {
      await testDestination.testAction(actionSlug, {
        event: event,
        mapping: {
          catalog_name: 'cars',
          item_id: {
            '@path': '$.properties.id'
          },
          enable_batching: false,
          __segment_internal_sync_mode: 'update'
        },
        settings: { ...settingsData, endpoint: settings.endpoint },
        auth: undefined
      })
    } catch (error) {
      expect(error.code).toBe('PAYLOAD_VALIDATION_FAILED')
      expect(error.status).toBe(400)
    }
  })
  it('should work with batched events with delete syncmode', async () => {
    const action = destination.actions[actionSlug]
    const [settingsData] = generateTestData(seedName, destination, action, true)
    nock(/.*/).persist().delete(/.*/).reply(200)

    const events: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event 1',
        type: 'identify',
        receivedAt,
        properties: {
          id: 'car001',
          name: 'Model S',
          manufacturer: 'Tesla',
          price: 79999.99,
          discontinued: false,
          inception_date: '2012-06-22T04:00:00Z'
        }
      }),
      createTestEvent({
        event: 'Test Event 2',
        type: 'identify',
        receivedAt,
        properties: {
          id: 'car002',
          name: 'Model S',
          manufacturer: 'Tesla',
          price: 79999.99,
          discontinued: false,
          inception_date: '2012-06-22T04:00:00Z'
        }
      })
    ]

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      useDefaultMappings: false,
      features: {
        'cloudevent-spec-v02-allow': true
      },
      mapping: {
        catalog_name: 'cars',
        item_id: {
          '@path': '$.properties.id'
        },
        enable_batching: true,
        __segment_internal_sync_mode: 'delete'
      },
      settings: { ...settingsData, endpoint: settings.endpoint }
    })

    expect(responses).not.toBeNull()
    expect(testDestination.results.at(0)?.multistatus?.length).toBe(2)
    expect(testDestination.results[0].multistatus?.[0]?.status).toBe(200)
    expect(testDestination.results[0].multistatus?.[1]?.status).toBe(200)
  })
  it('should work with batched events with upsert syncmode', async () => {
    const action = destination.actions[actionSlug]
    const [settingsData] = generateTestData(seedName, destination, action, true)
    nock(/.*/).persist().put(/.*/).reply(200)

    const events: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event 1',
        type: 'identify',
        receivedAt,
        properties: {
          id: 'car001',
          name: 'Model S',
          manufacturer: 'Tesla',
          price: 79999.99,
          discontinued: false,
          inception_date: '2012-06-22T04:00:00Z'
        }
      }),
      createTestEvent({
        event: 'Test Event 2',
        type: 'identify',
        receivedAt,
        properties: {
          id: 'car002',
          name: 'Model S',
          manufacturer: 'Tesla',
          price: 79999.99,
          discontinued: false,
          inception_date: '2012-06-22T04:00:00Z'
        }
      })
    ]

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      useDefaultMappings: false,
      features: {
        'cloudevent-spec-v02-allow': true
      },
      mapping: {
        catalog_name: 'cars',
        item_id: {
          '@path': '$.properties.id'
        },
        enable_batching: true,
        __segment_internal_sync_mode: 'upsert',
        item: {
          name: {
            '@path': '$.properties.name'
          },
          launch_date: {
            '@path': '$.properties.launch_date'
          },
          inception_date: {
            '@path': '$.properties.inception_date'
          },
          price: {
            '@path': '$.properties.price'
          },
          discontinued: {
            '@path': '$.properties.discontinued'
          },
          manufacturer: {
            '@path': '$.properties.company'
          }
        }
      },
      settings: { ...settingsData, endpoint: settings.endpoint }
    })

    expect(responses).not.toBeNull()
    expect(testDestination.results.at(0)?.multistatus?.length).toBe(2)
    expect(testDestination.results[0].multistatus?.[0]?.status).toBe(200)
    expect(testDestination.results[0].multistatus?.[1]?.status).toBe(200)
  })
  it('should skip events with missing item objects with upsert syncmode ', async () => {
    const action = destination.actions[actionSlug]
    const [settingsData] = generateTestData(seedName, destination, action, true)
    nock(/.*/).persist().put(/.*/).reply(200)

    const events: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event 1',
        type: 'identify',
        receivedAt,
        properties: {
          id: 'car001',
          name: 'Model S',
          manufacturer: 'Tesla',
          price: 79999.99,
          discontinued: false,
          inception_date: '2012-06-22T04:00:00Z'
        }
      }),
      createTestEvent({
        event: 'Test Event 2',
        type: 'identify',
        receivedAt,
        properties: {
          id: 'car002'
        }
      })
    ]

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      useDefaultMappings: false,
      features: {
        'cloudevent-spec-v02-allow': true
      },
      mapping: {
        catalog_name: 'cars',
        item_id: {
          '@path': '$.properties.id'
        },
        item: {
          name: {
            '@path': '$.properties.name'
          },
          launch_date: {
            '@path': '$.properties.launch_date'
          },
          inception_date: {
            '@path': '$.properties.inception_date'
          },
          price: {
            '@path': '$.properties.price'
          },
          discontinued: {
            '@path': '$.properties.discontinued'
          },
          manufacturer: {
            '@path': '$.properties.company'
          }
        },
        enable_batching: true,
        __segment_internal_sync_mode: 'upsert'
      },
      settings: { ...settingsData, endpoint: settings.endpoint }
    })

    expect(responses).not.toBeNull()
    expect(testDestination.results.at(0)?.multistatus?.length).toBe(2)
    expect(testDestination.results[0].multistatus?.[0]?.status).toBe(200)
    expect(testDestination.results[0].multistatus?.[1]?.status).toBe(400)
  })
  it('should resolve to multi-status in case of failures with upsert syncmode', async () => {
    const action = destination.actions[actionSlug]
    const [settingsData] = generateTestData(seedName, destination, action, true)
    nock(settings.endpoint)
      .persist()
      .put('/catalogs/cars/items/')
      .reply(400, {
        message: 'Invalid Request',
        errors: [
          {
            id: 'invalid-fields',
            message: 'Some of the fields given do not exist in the catalog',
            parameters: ['id'],
            parameter_values: ['car002']
          }
        ]
      })

    const events: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event 1',
        type: 'identify',
        receivedAt,
        properties: {
          id: 'car001',
          name: 'Model S',
          manufacturer: 'Tesla',
          price: 79999.99,
          discontinued: false,
          inception_date: '2012-06-22T04:00:00Z'
        }
      }),
      createTestEvent({
        event: 'Test Event 2',
        type: 'identify',
        receivedAt,
        properties: {
          id: 'car002',
          name: 'Mustang 2005',
          manufacturer: 'Ford',
          price: 55999.5,
          in_stock: false,
          discontinued: false,
          inception_date: '1964-04-17T07:00:00Z'
        }
      })
    ]

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      useDefaultMappings: false,
      features: {
        'cloudevent-spec-v02-allow': true
      },
      mapping: {
        catalog_name: 'cars',
        item_id: {
          '@path': '$.properties.id'
        },
        item: {
          name: {
            '@path': '$.properties.name'
          },
          launch_date: {
            '@path': '$.properties.launch_date'
          },
          inception_date: {
            '@path': '$.properties.inception_date'
          },
          price: {
            '@path': '$.properties.price'
          },
          discontinued: {
            '@path': '$.properties.discontinued'
          },
          manufacturer: {
            '@path': '$.properties.company'
          }
        },
        enable_batching: true,
        __segment_internal_sync_mode: 'upsert'
      },
      settings: { ...settingsData, endpoint: settings.endpoint }
    })

    expect(responses).not.toBeNull()
    expect(testDestination.results.at(0)?.multistatus?.length).toBe(2)
    expect(testDestination.results[0].multistatus?.[0]?.status).toBe(500)
    expect(testDestination.results[0].multistatus?.[1]?.status).toBe(400)
  })
  it('single event should throw error in case of failures with upsert syncmode', async () => {
    const action = destination.actions[actionSlug]
    const [settingsData] = generateTestData(seedName, destination, action, true)
    nock(settings.endpoint)
      .persist()
      .put('/catalogs/cars/items/car002')
      .reply(400, {
        message: 'Invalid Request',
        errors: [
          {
            id: 'invalid-fields',
            message: 'Some of the fields given do not exist in the catalog',
            parameters: ['id'],
            parameter_values: ['car002']
          }
        ]
      })

    const event: SegmentEvent = createTestEvent({
      event: 'Test Event 2',
      type: 'identify',
      receivedAt,
      properties: {
        id: 'car002',
        name: 'Mustang 2005',
        manufacturer: 'Ford',
        price: 55999.5,
        in_stock: false,
        discontinued: false,
        inception_date: '1964-04-17T07:00:00Z'
      }
    })

    try {
      await testDestination.testAction(actionSlug, {
        event,
        useDefaultMappings: false,
        features: {
          'cloudevent-spec-v02-allow': true
        },
        mapping: {
          catalog_name: 'cars',
          item_id: {
            '@path': '$.properties.id'
          },
          item: {
            name: {
              '@path': '$.properties.name'
            },
            launch_date: {
              '@path': '$.properties.launch_date'
            },
            inception_date: {
              '@path': '$.properties.inception_date'
            },
            price: {
              '@path': '$.properties.price'
            },
            discontinued: {
              '@path': '$.properties.discontinued'
            },
            manufacturer: {
              '@path': '$.properties.company'
            }
          },
          enable_batching: true,
          __segment_internal_sync_mode: 'upsert'
        },
        settings: { ...settingsData, endpoint: settings.endpoint }
      })
    } catch (error) {
      expect(error.status).toBe(400)
    }
  })
  it('should resolve catalog_name dynamic fields', async () => {
    nock(/.*/)
      .persist()
      .get(/.*/)
      .reply(200, {
        catalogs: [
          {
            description: 'My Restaurants',
            fields: [
              {
                name: 'id',
                type: 'string'
              },
              {
                name: 'Name',
                type: 'string'
              },
              {
                name: 'City',
                type: 'string'
              },
              {
                name: 'Cuisine',
                type: 'string'
              },
              {
                name: 'Rating',
                type: 'number'
              },
              {
                name: 'Loyalty_Program',
                type: 'boolean'
              },
              {
                name: 'Created_At',
                type: 'time'
              }
            ],
            name: 'restaurants',
            num_items: 10,
            updated_at: '2022-11-02T20:04:06.879+00:00'
          },
          {
            description: 'My Catalog',
            fields: [
              {
                name: 'id',
                type: 'string'
              },
              {
                name: 'string_field',
                type: 'string'
              },
              {
                name: 'number_field',
                type: 'number'
              },
              {
                name: 'boolean_field',
                type: 'boolean'
              },
              {
                name: 'time_field',
                type: 'time'
              }
            ],
            name: 'my_catalog',
            num_items: 3,
            updated_at: '2022-11-02T09:03:19.967+00:00'
          }
        ],
        message: 'success'
      })

    const responses = (await testDestination.testDynamicField(actionSlug, 'catalog_name', {
      settings,
      payload: {}
    })) as DynamicFieldResponse

    expect(responses.choices).toHaveLength(2)
  })
  it('should return empty choices if no catalogs found', async () => {
    nock(/.*/).persist().get(/.*/).reply(200, {
      catalogs: [],
      message: 'No catalogs found'
    })

    const responses = (await testDestination.testDynamicField(actionSlug, 'catalog_name', {
      settings,
      payload: {}
    })) as DynamicFieldResponse

    expect(responses.choices).toHaveLength(0)
    expect(responses.error).toEqual({
      message: 'No catalogs found. Please create a catalog first',
      code: '404'
    })
  })
  it('should return error if unknown error occurs while fetching catalogs', async () => {
    nock(/.*/).persist().get(/.*/).reply(500, {
      message: 'Unknown error'
    })

    const responses = (await testDestination.testDynamicField(actionSlug, 'catalog_name', {
      settings,
      payload: {}
    })) as DynamicFieldResponse

    expect(responses.choices).toHaveLength(0)
    expect(responses.error).toEqual({
      message: 'Unknown error. Please try again later',
      code: '500'
    })
  })
})
