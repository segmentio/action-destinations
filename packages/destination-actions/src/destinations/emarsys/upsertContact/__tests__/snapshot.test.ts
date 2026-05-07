import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'upsertContact'
const destinationSlug = 'Emarsys'
const seedName = `${destinationSlug}#${actionSlug}`

const AUTH_HOST = 'https://auth.example.com'
const AUTH_PATH = '/oauth/token'
const API_HOST = 'https://api.example.com'
const API_BASE_PATH = '/api/'

const settingsData = {
  apiAuthEndpoint: `${AUTH_HOST}${AUTH_PATH}`,
  apiBaseUrl: `${API_HOST}${API_BASE_PATH}`,
  apiClientId: 'testclient',
  apiClientSecret: 'supersecret'
}

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData] = generateTestData(seedName, destination, action, true)

    nock(AUTH_HOST)
      .persist()
      .post(AUTH_PATH)
      .reply(200, { token_type: 'Bearer', access_token: 'test-token', expires_in: 3600 })
    nock(/.*/).persist().get(/.*/).reply(200, { replyCode: 0 })
    nock(/.*/).persist().post(/.*/).reply(200, { replyCode: 0 })
    nock(/.*/).persist().put(/.*/).reply(200, { replyCode: 0 })

    const event = createTestEvent({ properties: eventData })

    const responses = await testDestination.testAction(actionSlug, {
      event,
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
    const [eventData] = generateTestData(seedName, destination, action, false)

    nock(AUTH_HOST)
      .persist()
      .post(AUTH_PATH)
      .reply(200, { token_type: 'Bearer', access_token: 'test-token', expires_in: 3600 })
    nock(/.*/).persist().get(/.*/).reply(200, { replyCode: 0 })
    nock(/.*/).persist().post(/.*/).reply(200, { replyCode: 0 })
    nock(/.*/).persist().put(/.*/).reply(200, { replyCode: 0 })

    const event = createTestEvent({ properties: eventData })

    const responses = await testDestination.testAction(actionSlug, {
      event,
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
})
