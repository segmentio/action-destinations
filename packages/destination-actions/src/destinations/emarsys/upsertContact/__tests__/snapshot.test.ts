import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
import { tokenCache } from '../../emarsys-helper'

const testDestination = createTestIntegration(destination)
const actionSlug = 'upsertContact'
const destinationSlug = 'Emarsys'
const seedName = `${destinationSlug}#${actionSlug}`

const AUTH_HOST = 'https://auth.example.com'
const AUTH_PATH = '/oauth/token'
const API_HOST = 'https://api.example.com'
const API_BASE_PATH = '/api/'

const settingsData = {
  auth_type: 'new',
  apiAuthEndpoint: `${AUTH_HOST}${AUTH_PATH}`,
  apiBaseUrl: `${API_HOST}${API_BASE_PATH}`,
  apiClientId: 'testclient',
  apiClientSecret: 'supersecret'
}

beforeEach(() => {
  nock.cleanAll()
  tokenCache.clear()
})

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData] = generateTestData(seedName, destination, action, true)

    nock(AUTH_HOST).post(AUTH_PATH).reply(200, { token_type: 'Bearer', access_token: 'test-token', expires_in: 3600 })
    nock(API_HOST).persist().get(/.*/).reply(200, { replyCode: 0 })
    nock(API_HOST).persist().post(/.*/).reply(200, { replyCode: 0 })
    nock(API_HOST).persist().put(/.*/).reply(200, { replyCode: 0 })

    const event = createTestEvent({ properties: eventData })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const apiResponse = responses.find((r) => {
      const url = new URL(r.request.url)
      return url.host === new URL(API_HOST).host && url.pathname.startsWith(API_BASE_PATH)
    })
    if (!apiResponse) throw new Error('No Emarsys API response found')
    const rawBody = await apiResponse.request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(apiResponse.request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData] = generateTestData(seedName, destination, action, false)

    nock(AUTH_HOST).post(AUTH_PATH).reply(200, { token_type: 'Bearer', access_token: 'test-token', expires_in: 3600 })
    nock(API_HOST).persist().get(/.*/).reply(200, { replyCode: 0 })
    nock(API_HOST).persist().post(/.*/).reply(200, { replyCode: 0 })
    nock(API_HOST).persist().put(/.*/).reply(200, { replyCode: 0 })

    const event = createTestEvent({ properties: eventData })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const apiResponse = responses.find((r) => {
      const url = new URL(r.request.url)
      return url.host === new URL(API_HOST).host && url.pathname.startsWith(API_BASE_PATH)
    })
    if (!apiResponse) throw new Error('No Emarsys API response found')
    const rawBody = await apiResponse.request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(apiResponse.request.headers).toMatchSnapshot()
  })
})
