import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
import { TransactionContext } from '@segment/actions-core/destination-kit'

const testDestination = createTestIntegration(destination)
const actionSlug = 'upsertContact'
const destinationSlug = 'HubSpot'
const seedName = `${destinationSlug}#${actionSlug}`

beforeEach(() => nock.cleanAll())

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields - update contact', async () => {
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
    const json = await request.json()

    expect(json).toMatchSnapshot()

    expect(request.headers).toMatchSnapshot()
    expect(request.url).toMatchSnapshot()
  })

  it('all fields - update contact', async () => {
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
    const json = await request.json()

    expect(json).toMatchSnapshot()
    expect(request.url).toMatchSnapshot()
  })

  it('required fields - create contact', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().patch(/.*/).reply(404)
    nock(/.*/).persist().post(/.*/).reply(200)

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

    const request = responses[1].request
    const json = await request.json()

    expect(json).toMatchSnapshot()

    expect(request.headers).toMatchSnapshot()
    expect(request.url).toMatchSnapshot()
  })

  it('all fields - create contact', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().patch(/.*/).reply(404)
    nock(/.*/).persist().post(/.*/).reply(200)

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

    const request = responses[1].request
    const json = await request.json()

    expect(json).toMatchSnapshot()
    expect(request.url).toMatchSnapshot()
  })
})
