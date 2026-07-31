import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-marketo-private'

// A resolved OAuth2 token, matching what the platform supplies in production once
// refreshAccessToken has run. Ensures the Authorization header snapshot is realistic.
const auth = { accessToken: 'test-access-token', refreshToken: 'test-refresh-token' }

// Marketo returns HTTP 200 with this body shape; the token endpoint returns an access token.
function mockMarketo() {
  nock(/.*/)
    .persist()
    .post(/identity\/oauth\/token/)
    .reply(200, { access_token: 'test-access-token', token_type: 'bearer', expires_in: 3599 })
  nock(/.*/)
    .persist()
    .post(/submitForm/)
    .reply(200, { requestId: 'abc', success: true, result: [{ id: 1, status: 'created' }] })
}

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  afterEach(() => {
    nock.cleanAll()
  })

  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      mockMarketo()

      const event = createTestEvent({
        properties: eventData
      })

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: settingsData,
        auth
      })

      const request = responses[responses.length - 1].request
      const rawBody = await request.text()

      try {
        const json = JSON.parse(rawBody)
        expect(json).toMatchSnapshot()
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }

      expect(request.headers).toMatchSnapshot()
    })

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      mockMarketo()

      const event = createTestEvent({
        properties: eventData
      })

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: settingsData,
        auth
      })

      const request = responses[responses.length - 1].request
      const rawBody = await request.text()

      try {
        const json = JSON.parse(rawBody)
        expect(json).toMatchSnapshot()
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }

      expect(request.headers).toMatchSnapshot()
    })
  }
})
