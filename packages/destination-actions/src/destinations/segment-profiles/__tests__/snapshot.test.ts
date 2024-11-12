import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-segment-profiles'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      let event
      if (actionSlug === 'sendSubscription') {
        event = createTestEvent({
          properties: {
            email: 'tester11@seg.com',
            email_subscription_status: true,
            phone: '+12135618345',
            sms_subscription_status: true,
            engage_space: 'engage-space-writekey',
            user_id: 'user12'
          }
        })
      } else {
        event = createTestEvent({
          properties: eventData
        })
      }

      await testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: { ...settingsData },
        auth: undefined
      })

      const results = testDestination.results
      expect(results[results.length - 1]).toMatchSnapshot()
    })

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

      let event
      if (actionSlug === 'sendSubscription') {
        event = createTestEvent({
          properties: {
            email: 'tester11@seg.com',
            email_subscription_status: true,
            phone: '+12135618345',
            sms_subscription_status: true,
            engage_space: 'engage-space-writekey',
            user_id: 'user12'
          }
        })
      } else {
        event = createTestEvent({
          properties: eventData
        })
      }

      await testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: { ...settingsData },
        auth: undefined
      })

      const results = testDestination.results
      expect(results[results.length - 1]).toMatchSnapshot()
    })
  }
})
