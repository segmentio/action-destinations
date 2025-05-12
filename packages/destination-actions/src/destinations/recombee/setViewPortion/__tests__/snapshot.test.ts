import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
import { Chance } from 'chance'

const testDestination = createTestIntegration(destination)
const actionSlug = 'setViewPortion'
const destinationSlug = 'Recombee'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    eventData.portion = new Chance(seedName).floating({ min: 0, max: 1 })

    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
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
    eventData.portion = new Chance(seedName).floating({ min: 0, max: 1 })

    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
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

  it('should fail if portion is larger than 1', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    eventData.portion = new Chance(seedName).floating({ min: 1.1 })

    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowErrorMatchingSnapshot()
  })

  it('should fail if portion is smaller than 0', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    eventData.portion = new Chance(seedName).floating({ max: -0.1 })

    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowErrorMatchingSnapshot()
  })
})
