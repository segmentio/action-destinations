import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-memora'

// Mock Date.now() to return a fixed timestamp for consistent snapshots
const FIXED_TIMESTAMP = 1700000000000
const originalDateNow = Date.now
beforeAll(() => {
  Date.now = jest.fn(() => FIXED_TIMESTAMP)
})

afterAll(() => {
  Date.now = originalDateNow
})

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(202)

      const event = createTestEvent({
        properties: eventData
      })

      // Add memora_store to mapping since it's required
      const mapping = {
        ...event.properties,
        memora_store: 'test-store-id',
        contact_identifiers: {
          email: 'test@example.com'
        },
        contact_traits: {
          firstName: 'Test'
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

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(202)

      const event = createTestEvent({
        properties: eventData
      })

      // Add memora_store to mapping since it's required
      const mapping = {
        ...event.properties,
        memora_store: 'test-store-id',
        contact_identifiers: {
          email: 'test@example.com'
        },
        contact_traits: {
          firstName: 'Test',
          lastName: 'User'
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

    it(`${actionSlug} action - should throw error when memora_store is missing`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      const event = createTestEvent({
        properties: eventData
      })

      const mapping = {
        ...event.properties,
        contact_identifiers: {
          email: 'test@example.com'
        },
        contact_traits: {
          firstName: 'Test'
        }
      }

      await expect(
        testDestination.testAction(actionSlug, {
          event: event,
          mapping: mapping,
          settings: settingsData,
          auth: undefined
        })
      ).rejects.toThrow()
    })

    it(`${actionSlug} action - should throw error when profile has no traits`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(202)
      nock(/.*/).persist().put(/.*/).reply(202)

      const event = createTestEvent({
        properties: eventData
      })

      const mapping = {
        ...event.properties,
        memora_store: 'test-store-id',
        contact_identifiers: {},
        contact_traits: {}
      }

      await expect(
        testDestination.testAction(actionSlug, {
          event: event,
          mapping: mapping,
          settings: settingsData,
          auth: undefined
        })
      ).rejects.toThrow('No valid profiles found for import')
    })
  }
})
