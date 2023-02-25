import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-acoustic-segment-connector'

const settings: Settings = {
  a_pod: "2",
  a_region: "US",
  a_client_id: "1d99f8d8-0897-4090-983a-c517cc54032e",
  a_client_secret: "124bd238-0987-40a2-b8fb-879ddd4d324",
  a_refresh_token: "rD-7E2r8BynGDaapr13oJV9BxQr20lsYGN9RPkbrtPtAS1",
  a_attrMax: 30,
  a_authAPIURL: 'https://api-campaign-US-2.goacoustic.com/oauth/token',
  a_xmlAPIURL: 'https://api-campaign-US-2.goacoustic.com/XMLAPI',
  a_deleteCode: 0,
  app_Notes: '99',
  a_traits_properties: `
  track=event.context.traits.firstName,
  track=event.context.traits.lastName,
  identify=event.traits.firstName,
  identify=event.traits.lastName
  `
}
settings.a_pod

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


  }
})
