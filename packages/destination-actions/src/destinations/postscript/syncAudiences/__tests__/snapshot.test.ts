import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
import Chance from 'chance'

const testDestination = createTestIntegration(destination)
const actionSlug = 'syncAudiences'
const destinationSlug = 'Postscript'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action with:`, () => {
  if (actionSlug === 'syncAudiences') {
    it('required fields (with email)', async () => {
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      // Add email
      eventData.email = new Chance(seedName).email()

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

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

    it('required fields (with phone for syncAudiences)', async () => {
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      // Add phone
      eventData.phone = new Chance(seedName).string({
        length: 10,
        pool: '0123456789'
      })

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

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
  } else {
    it('required fields', async () => {
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

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
  }

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

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
})
