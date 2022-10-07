import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import { generateValidHubSpotCustomObjectName } from '../testHelper'
import nock from 'nock'
<<<<<<< HEAD
=======
import { TransactionContext } from '@segment/actions-core/src/destination-kit'
>>>>>>> CONMAN-199

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
<<<<<<< HEAD
      nock(/.*/).persist().put(/.*/).reply(200)

=======
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

>>>>>>> CONMAN-199
      const event = createTestEvent({
        properties: eventData
      })

      try {
        const responses = await testDestination.testAction(actionSlug, {
          event: event,
          mapping: event.properties,
          settings: settingsData,
<<<<<<< HEAD
          auth: undefined
=======
          auth: undefined,
          transactionContext
>>>>>>> CONMAN-199
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

<<<<<<< HEAD
      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(201)
=======
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
>>>>>>> CONMAN-199
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({
        properties: eventData
      })

      try {
        const responses = await testDestination.testAction(actionSlug, {
          event: event,
          mapping: event.properties,
          settings: settingsData,
<<<<<<< HEAD
          auth: undefined
=======
          auth: undefined,
          transactionContext
>>>>>>> CONMAN-199
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

describe(`Testing snapshot for testHelper:`, () => {
<<<<<<< HEAD
  it(`empty seed`, async () => {
    const customObjectName = generateValidHubSpotCustomObjectName('')
    expect(customObjectName).toMatchSnapshot()
  })
=======
  it(`should generate a valid hash with empty seed value`, async () => {
    const customObjectName = generateValidHubSpotCustomObjectName('')
    expect(customObjectName).toMatchSnapshot()
  })
  it(`should generate a valid hash with a seed value`, async () => {
    const seed = 'test-seed-value'
    const customObjectName = generateValidHubSpotCustomObjectName(seed)
    expect(customObjectName).toMatchSnapshot()
  })
>>>>>>> CONMAN-199
})
