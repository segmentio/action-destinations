import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import { TransactionContext } from '@segment/actions-core/destination-kit'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'segment'

const settingsData = {
  source_write_key: 'test-source-write-key'
}

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, _] = generateTestData(seedName, destination, action, true)

      const transactionContext: TransactionContext = {
        transaction: {},
        setTransaction: (key, value) => ({ [key]: value })
      }

      const event = createTestEvent({
        properties: eventData
      })

      try {
        await testDestination.testAction(actionSlug, {
          event: event,
          mapping: event.properties,
          settings: settingsData,
          auth: undefined,
          transactionContext
        })
        expect(testDestination.results).toMatchSnapshot()
      } catch (e) {
        expect(e).toMatchSnapshot()
      }
    })

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, _] = generateTestData(seedName, destination, action, false)

      const transactionContext: TransactionContext = {
        transaction: {},
        setTransaction: (key, value) => ({ [key]: value })
      }

      const event = createTestEvent({
        properties: eventData
      })

      try {
        await testDestination.testAction(actionSlug, {
          event: event,
          mapping: event.properties,
          settings: settingsData,
          auth: undefined,
          transactionContext
        })
        expect(testDestination.results).toMatchSnapshot()
      } catch (e) {
        expect(e).toMatchSnapshot()
      }
    })
  }
})
