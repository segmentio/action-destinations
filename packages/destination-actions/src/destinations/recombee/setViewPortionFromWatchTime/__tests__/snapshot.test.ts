import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
import { Chance } from 'chance'

const testDestination = createTestIntegration(destination)
const actionSlug = 'setViewPortionFromWatchTime'
const destinationSlug = 'Recombee'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    eventData.portion.totalLength = new Chance(seedName).floating({ min: 0 })
    eventData.portion.watchTime = new Chance(seedName).floating({ min: 0, max: eventData.portion.totalLength })

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
    eventData.portion.totalLength = new Chance(seedName).floating({ min: 0 })
    eventData.portion.watchTime = new Chance(seedName).floating({ min: 0, max: eventData.portion.totalLength })

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

  it('should fail when totalLength is 0', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    eventData.portion.totalLength = 0
    eventData.portion.watchTime = new Chance(seedName).floating({ min: 0 })

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

  it('should fail when watchTime is greater than totalLength', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    eventData.portion.totalLength = new Chance(seedName).floating({ min: 0 })
    eventData.portion.watchTime = new Chance(seedName).floating({ min: eventData.portion.totalLength + 1 })

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
