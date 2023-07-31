import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'
import { TransactionContext } from '@segment/actions-core/destination-kit'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-hubspot-cloud'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(201)
      nock(/.*/)
        .persist()
        .patch(/.*/)
        .reply(200, {
          id: '801',
          properties: {
            lifecyclestage: eventData.lifecyclestage
          }
        })
      nock(/.*/).persist().put(/.*/).reply(200)

      const transactionContext: TransactionContext = {
        transaction: {},
        setTransaction: (key, value) => ({ [key]: value })
      }

      const event = createTestEvent({
        properties: eventData
      })

      try {
        const responses = await testDestination.testAction(actionSlug, {
          event: event,
          mapping: event.properties,
          settings: settingsData,
          auth: undefined,
          transactionContext
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
      } catch (e) {
        expect(e).toMatchSnapshot()
      }
    })

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      const transactionContext: TransactionContext = {
        transaction: {},
        setTransaction: (key, value) => ({ [key]: value })
      }

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(201)
      nock(/.*/)
        .persist()
        .patch(/.*/)
        .reply(200, {
          id: '801',
          properties: {
            lifecyclestage: eventData.lifecyclestage
          }
        })
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({
        properties: eventData
      })

      try {
        const responses = await testDestination.testAction(actionSlug, {
          event: event,
          mapping: event.properties,
          settings: settingsData,
          auth: undefined,
          transactionContext
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
      } catch (e) {
        expect(e).toMatchSnapshot()
      }
    })
  }
})
