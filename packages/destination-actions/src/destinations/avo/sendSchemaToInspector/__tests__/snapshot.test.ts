import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendSchemaToInspector'
const destinationSlug = 'Avo'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    // Ensure apiKey and env are set (required for event spec fetching)
    settingsData.apiKey = settingsData.apiKey || 'test-api-key'
    settingsData.env = settingsData.env || 'dev'

    // Mock the /getEventSpec endpoint with a valid JSON response (empty object will fail validation and return null, which is expected)
    nock(/.*/)
      .persist()
      .get(/getEventSpec/)
      .reply(200, {}, { 'Content-Type': 'application/json' })
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: {
        ...event.properties,
        anonymousId: 'test-stream-id'
      },
      settings: settingsData,
      auth: undefined
    })

    // Find the POST request to /inspector/segment/v1/track (the actual action request)
    // The GET request to /getEventSpec will be first, so we want the POST one
    const postResponse =
      responses.find((r: any) => r.request?.url?.includes('/inspector/segment/v1/track')) ||
      responses[responses.length - 1]

    const request = postResponse.request
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

    // Ensure apiKey and env are set (required for event spec fetching)
    settingsData.apiKey = settingsData.apiKey || 'test-api-key'
    settingsData.env = settingsData.env || 'dev'

    // Mock the /getEventSpec endpoint with a valid JSON response (empty object will fail validation and return null, which is expected)
    nock(/.*/)
      .persist()
      .get(/getEventSpec/)
      .reply(200, {}, { 'Content-Type': 'application/json' })
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: {
        ...event.properties,
        anonymousId: 'test-stream-id'
      },
      settings: settingsData,
      auth: undefined
    })

    // Find the POST request to /inspector/segment/v1/track (the actual action request)
    const postResponse =
      responses.find((r: any) => r.request?.url?.includes('/inspector/segment/v1/track')) ||
      responses[responses.length - 1]

    const request = postResponse.request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
  })

  it('expect app Version to be extracted from property when set in settings', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    // Ensure apiKey and env are set (required for event spec fetching)
    settingsData.apiKey = settingsData.apiKey || 'test-api-key'
    settingsData.env = settingsData.env || 'dev'
    settingsData.appVersionPropertyName = 'appVersion'

    // Mock the /getEventSpec endpoint with a valid JSON response (empty object will fail validation and return null, which is expected)
    nock(/.*/)
      .persist()
      .get(/getEventSpec/)
      .reply(200, {}, { 'Content-Type': 'application/json' })
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        ...eventData,
        appVersion: '2.0.3'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: {
        ...event.properties,
        anonymousId: 'test-stream-id'
      },
      settings: settingsData,
      auth: undefined
    })

    // Find the POST request to /inspector/segment/v1/track (the actual action request)
    const postResponse =
      responses.find((r: any) => r.request?.url?.includes('/inspector/segment/v1/track')) ||
      responses[responses.length - 1]

    const request = postResponse.request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
  })
})
