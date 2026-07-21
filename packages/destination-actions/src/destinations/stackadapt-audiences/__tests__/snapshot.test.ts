import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-stackadapt-audiences'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
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
        mapping: {
          ...event.properties,
          standard_traits: {
            birth_date: "1990-03-24",
            first_name: "John",
            last_name: "Doe",
            phone: "1234567890",
            address: "10 pleasant st.",
            city: "Pleasantville",
            state: "CA",
            zip: "12345",
            country: "USA",
            postal_code: "12345",
            timezone: "PST"
          }
        },
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

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({
        properties: eventData
      })

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: {
          ...event.properties,
          standard_traits: {
            birth_date: "1990-03-24",
            first_name: "John",
            last_name: "Doe",
            phone: "1234567890",
            address: "10 pleasant st.",
            city: "Pleasantville",
            state: "CA",
            zip: "12345",
            country: "USA",
            postal_code: "12345",
            timezone: "PST"
          }
        },
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
