import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-appsflyer'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      nock(/.*/).persist().post(/.*/).reply(200)

      const event = createTestEvent({ properties: eventData })

      const responses = await testDestination.testAction(actionSlug, {
        event,
        mapping: { ...event.properties, device_type: 'ios' },
        settings: { ...settingsData, appleAppID: '822613531', devKey: 'test-dev-key' },
        auth: undefined
      })

      if (!responses[0] || !responses[0].request) {
        expect(responses).toMatchSnapshot()
        return
      }

      const rawBody = await responses[0].request.text()
      try {
        expect(JSON.parse(rawBody)).toMatchSnapshot()
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }
    })

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      nock(/.*/).persist().post(/.*/).reply(200)

      const event = createTestEvent({ properties: eventData })

      const responses = await testDestination.testAction(actionSlug, {
        event,
        mapping: { ...event.properties, device_type: 'ios' },
        settings: { ...settingsData, appleAppID: '822613531', devKey: 'test-dev-key' },
        auth: undefined
      })

      if (!responses[0] || !responses[0].request) {
        expect(responses).toMatchSnapshot()
        return
      }

      const rawBody = await responses[0].request.text()
      try {
        expect(JSON.parse(rawBody)).toMatchSnapshot()
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }
    })
  }
})
