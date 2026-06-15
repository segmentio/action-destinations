import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendForm'
const destinationSlug = 'MarketoPrivate'
const seedName = `${destinationSlug}#${actionSlug}`

// Marketo returns HTTP 200 with this body shape; the token endpoint returns an access token.
// Both must succeed for the action's response handling to pass.
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

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
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
      auth: undefined
    })

    // The submitForm request is the last one (after the token request).
    const request = responses[responses.length - 1].request
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

    mockMarketo()

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[responses.length - 1].request
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
