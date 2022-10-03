import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
import { TransactionContext } from '@segment/actions-core/src/destination-kit'

const testDestination = createTestIntegration(destination)
const actionSlug = 'upsertContact'
const destinationSlug = 'Hubspot'
const seedName = `${destinationSlug}#${actionSlug}`

beforeEach(() => nock.cleanAll())

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().patch(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const transactionContext: TransactionContext = {
      transaction: {},
      setTransaction: (key, value) => ({ [key]: value })
    }

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
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/)
      .persist()
      .patch(/.*/)
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: eventData.lifecyclestage.toLowerCase()
        }
      })

    const event = createTestEvent({
      properties: eventData
    })

    const transactionContext: TransactionContext = {
      transaction: {},
      setTransaction: (key, value) => ({ [key]: value })
    }

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
  })
})
