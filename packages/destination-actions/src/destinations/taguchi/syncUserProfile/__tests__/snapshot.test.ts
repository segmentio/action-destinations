import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'syncUserProfile'
const destinationSlug = 'Taguchi'
const seedName = `${destinationSlug}#${actionSlug}`

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
      mapping: {
        ...event.properties,
        identifiers: {
          ref: 'test-user-123',
          email: 'test@example.com'
        }
      },
      settings: {
        ...settingsData,
        integrationURL: 'https://api.taguchi.com.au',
        apiKey: 'test-api-key',
        organizationId: '123'
      },
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
      mapping: {
        ...event.properties,
        identifiers: {
          ref: 'test-user-123',
          email: 'test@example.com'
        },
        timestamp: '2024-06-10T10:00:00.000Z',
        traits: {
          title: 'DR',
          firstname: 'Test',
          lastname: 'User',
          dob: '2024-06-10',
          gender: 'M',
          address: '123 Test St',
          address2: 'Testville',
          address3: 'TS',
          suburb: 'Test Suburb',
          state: 'Test State',
          postcode: '12345',
          country: 'Test Country',
          phone: '+1234567890'
        }
      },
      settings: {
        ...settingsData,
        integrationURL: 'https://api.taguchi.com.au',
        apiKey: 'test-api-key',
        organizationId: '123'
      },
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
