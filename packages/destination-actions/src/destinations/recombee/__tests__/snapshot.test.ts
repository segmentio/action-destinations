import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'
import { Chance } from 'chance'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-recombee'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      // Set required fields for setViewPortionFromWatchTime and setViewPortion (properly tested in their own test files)
      if (actionSlug === 'setViewPortionFromWatchTime') {
        eventData.portion.totalLength = new Chance(seedName).floating({ min: 0 })
        eventData.portion.watchTime = new Chance(seedName).floating({ min: 0, max: eventData.portion.totalLength })
      } else if (actionSlug === 'setViewPortion') {
        eventData.portion = new Chance(seedName).floating({ min: 0, max: 1 })
      }

      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)
      nock(/.*/).persist().delete(/.*/).reply(200)

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

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      // Set required fields for setViewPortionFromWatchTime and setViewPortion (properly tested in their own test files)
      if (actionSlug === 'setViewPortionFromWatchTime') {
        eventData.portion.totalLength = new Chance(seedName).floating({ min: 0 })
        eventData.portion.watchTime = new Chance(seedName).floating({ min: 0, max: eventData.portion.totalLength })
      } else if (actionSlug === 'setViewPortion') {
        eventData.portion = new Chance(seedName).floating({ min: 0, max: 1 })
      }

      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)
      nock(/.*/).persist().delete(/.*/).reply(200)

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
  }
})
