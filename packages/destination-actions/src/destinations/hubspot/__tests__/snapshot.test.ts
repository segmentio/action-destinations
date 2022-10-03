import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import { generateValidHubSpotCustomObjectName } from '../testHelper'
import nock from 'nock'

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
      nock(/.*/).persist().patch(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({
        properties: eventData
      })

      try {
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
      } catch (e) {
        expect(e).toMatchSnapshot()
      }
    })

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(201)
      nock(/.*/).persist().patch(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({
        properties: eventData
      })

      try {
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
      } catch (e) {
        expect(e).toMatchSnapshot()
      }
    })
  }
})

describe(`Testing snapshot for testHelper:`, () => {
  it(`should generate a valid hash with empty seed value`, async () => {
    const customObjectName = generateValidHubSpotCustomObjectName('')
    expect(customObjectName).toMatchSnapshot()
  })
  it(`should generate a valid hash with a seed value`, async () => {
    const seed = 'test-seed-value'
    const customObjectName = generateValidHubSpotCustomObjectName(seed)
    expect(customObjectName).toMatchSnapshot()
  })
})
