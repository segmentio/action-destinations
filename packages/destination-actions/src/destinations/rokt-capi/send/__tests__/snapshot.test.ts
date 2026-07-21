import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'send'
const destinationSlug = 'RoktCapi'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData,
      userId: 'test-user-id-123'
    })

    const mapping = {
      ...event.properties,
      user_identities: {
        customerid: 'test-user-id-123'
      }
    }

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: mapping,
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
      properties: eventData,
      userId: 'test-user-id-456',
      context: {
        traits: {
          email: 'test@example.com'
        }
      }
    })

    const mapping = {
      ...event.properties,
      // Ensure batch_size is within valid range (1-100)
      batch_size: Math.max(1, Math.min(event.properties.batch_size || 100, 100)),
      user_identities: {
        customerid: 'test-user-id-456',
        email: 'test@example.com'
      }
    }

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: mapping,
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
