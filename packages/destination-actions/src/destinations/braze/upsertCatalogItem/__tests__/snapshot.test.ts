import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
const testDestination = createTestIntegration(destination)
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

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
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

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
  })

  it('single event with upsert should fail if there is no item object', async () => {
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
          __segment_internal_sync_mode: 'upsert'
        },
        settings: { ...settingsData, endpoint: settings.endpoint },
        auth: undefined
      })
    } catch (error) {
      expect(error.message).toMatchSnapshot()
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

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
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

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      settings: { ...settingsData, endpoint: settings.endpoint },
      mapping: { ...event.properties, __segment_internal_sync_mode: 'delete' },
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      expect(json.status).toBe(200)
      expect(json.message).toBe('Could not find item')
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
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
      expect(error.message).toMatchSnapshot()
      expect(error.code).toBe('PAYLOAD_VALIDATION_FAILED')
      expect(error.status).toBe(400)
    }
  })

  it('it should work with batched events with upsert syncmode', async () => {
    const action = destination.actions[actionSlug]
    const [settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
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
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchSnapshot()
  })
  it('it should work with batched events with delete syncmode', async () => {
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
        __segment_internal_sync_mode: 'delete'
      },
      settings: { ...settingsData, endpoint: settings.endpoint }
    })

    expect(responses).not.toBeNull()
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchSnapshot()
  })
})
