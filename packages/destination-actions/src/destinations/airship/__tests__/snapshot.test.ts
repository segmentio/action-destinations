import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-airship'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
      settingsData.endpoint = 'https://go.airship.com'
      // nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/)
        .persist()
        .post('/api/channels/email')
        .reply(200, { ok: true, channel_id: '6be90795-a7d7-4657-b959-6a5afc199b06' })
      nock(/.*/).persist().post('/api/named_users/associate').reply(200, { ok: true })
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
      settingsData.endpoint = 'https://go.airship.com'

      nock(/.*/)
        .persist()
        .get(/.*/)
        .reply(200, {
          // content: {
          ok: true,
          channel: {
            channel_id: '6be90795-a7d7-4657-b959-6a5afc199b06'
          }
          // }
        })
      nock(/.*/)
        .persist()
        .post('/api/channels/email')
        .reply(200, { ok: true, channel_id: '6be90795-a7d7-4657-b959-6a5afc199b06' })
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
