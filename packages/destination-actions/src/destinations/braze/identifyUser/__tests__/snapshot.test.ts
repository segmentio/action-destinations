import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'identifyUser'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`
const settings = {
  api_key: 'my-api-key',
  endpoint: 'https://rest.iad-01.braze.com'
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
      mapping: event.properties,
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
      mapping: event.properties,
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

  it('it should work with batched events', async () => {
    nock(settings.endpoint).post('/users/identify').reply(200, {})

    const events = [
      createTestEvent({
        userId: 'user1',
        properties: {
          alias_label: 'foo',
          alias_name: 'bar'
        }
      }),
      createTestEvent({
        userId: 'user2',
        properties: {
          alias_label: 'boo',
          alias_name: 'baz'
        }
      }),
      createTestEvent({
        userId: 'user3',
        properties: {
          alias_label: 'foe',
          alias_name: 'fum'
        }
      })
    ]

    const mapping = {
      external_id: {
        '@path': '$.userId'
      },
      user_alias: {
        alias_label: {
          '@path': '$.properties.alias_label'
        },
        alias_name: {
          '@path': '$.properties.alias_name'
        }
      },
      enable_batching: true
    }

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      mapping,
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchSnapshot()
  })

  it('it should work with a single batched events', async () => {
    nock(settings.endpoint).post('/users/identify').reply(200, {})

    const events = [
      createTestEvent({
        userId: 'user1',
        properties: {
          alias_label: 'foo',
          alias_name: 'bar'
        }
      })
    ]

    const mapping = {
      external_id: {
        '@path': '$.userId'
      },
      user_alias: {
        alias_label: {
          '@path': '$.properties.alias_label'
        },
        alias_name: {
          '@path': '$.properties.alias_name'
        }
      },
      enable_batching: true
    }

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      mapping,
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchSnapshot()
  })
})
