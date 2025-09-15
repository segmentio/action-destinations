import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'updateUserProfile2'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`
const receivedAt = '2021-08-03T17:40:04.055Z'
const settings = {
  app_id: 'my-app-id',
  api_key: 'my-api-key',
  endpoint: 'https://rest.iad-01.braze.com' as const
}

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('only required fields', async () => {
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
      mapping: { ...event.properties, __segment_internal_sync_mode: 'update' },
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

  it('fails if sync mode is not update', async () => {
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
    ).rejects.toThrowError('Sync mode upsert is not supported')
  })

  it('it should work with batched events', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

    // ISO String can be obtained from new Date().toISOString()
    const isoString = '2000-01-05T12:00:00.00Z'

    const events: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event 1',
        type: 'identify',
        receivedAt,
        properties: {}
      }),
      createTestEvent({
        event: 'Test Event 2',
        type: 'identify',
        receivedAt,
        properties: {}
      })
    ]

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      useDefaultMappings: true,
      mapping: {
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
        date_of_first_session: isoString,
        date_of_last_session: isoString,
        marked_email_as_spam_at: isoString,
        enable_batching: true,
        __segment_internal_sync_mode: 'update'
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

  it('it should work with a single batched events', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

    const events: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event 1',
        type: 'identify',
        receivedAt,
        properties: {}
      })
    ]

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      useDefaultMappings: true,
      mapping: {
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
        enable_batching: true,
        __segment_internal_sync_mode: 'update'
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
