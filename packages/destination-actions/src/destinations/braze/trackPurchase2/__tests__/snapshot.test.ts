import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'trackPurchase2'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`
const receivedAt = '2021-08-03T17:40:04.055Z'
const settings = {
  app_id: 'my-app-id',
  api_key: 'my-api-key',
  endpoint: 'https://rest.iad-01.braze.com' as const
}

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: { ...event.properties, __segment_internal_sync_mode: 'add' },
      settings: settingsData,
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

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: { ...event.properties, __segment_internal_sync_mode: 'add' },
      settings: settingsData,
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
  })

  it('fails if sync mode is upsert', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    const event = createTestEvent({
      properties: eventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: { ...event.properties, __segment_internal_sync_mode: 'upsert' },
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowError()
  })

  it('it should work with batched events', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

    const events: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event 1',
        type: 'track',
        receivedAt,
        properties: {
          products: [
            {
              quantity: 1,
              product_id: 'Bowflex Treadmill 10',
              price: 100
            },
            {
              quantity: 2,
              product_id: 'Bowflex Treadmill 20',
              price: 200
            }
          ]
        }
      }),
      createTestEvent({
        event: 'Test Event 2',
        type: 'track',
        receivedAt,
        properties: {
          products: [
            {
              quantity: 3,
              product_id: 'Bowflex Treadmill 30',
              price: 300
            },
            {
              quantity: 4,
              product_id: 'Bowflex Treadmill 40',
              price: 400
            }
          ]
        }
      })
    ]

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      useDefaultMappings: true,
      // The email field defaults to traits.email when not otherwise set. This results in an undefined value for the email field in our snapshots
      // We do not send email: undefined downstream to Braze as actions will filter that out automatically
      mapping: {
        __segment_internal_sync_mode: 'add',
        external_id: {
          '@path': '$.userId'
        },
        user_alias: {},
        braze_id: {
          '@path': '$.properties.braze_id'
        },
        name: {
          '@path': '$.event'
        },
        time: {
          '@path': '$.receivedAt'
        },
        properties: {
          '@path': '$.properties'
        },
        products: {
          '@path': '$.properties.products'
        },
        enable_batching: true
      },
      settings: {
        ...settings
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchSnapshot()
  })
})
