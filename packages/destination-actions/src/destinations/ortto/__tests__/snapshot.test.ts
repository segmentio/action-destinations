import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'
import { TEST_API_KEY } from '../types'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-ortto'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData] = generateTestData(seedName, destination, action, true)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)
      nock(/.*/).persist().delete(/.*/).reply(200)

      const event = createTestEvent({
        properties: { ...eventData, timestamp: '2021-07-12T23:02:40.563Z' }
      })

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: { api_key: TEST_API_KEY },
        auth: undefined
      })

      const request = responses[0].request
      const rawBody = await request.text()

      try {
        const json = JSON.parse(rawBody)
        expect(
          json.map(({ timestamp, ...rest }: { timestamp: string; [key: string]: any }) => ({
            ...rest,
            timestamp: '2021-07-12T23:02:40.563Z'
          }))
        ).toMatchSnapshot()
        return
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }

      expect(request.headers).toMatchSnapshot()
    })

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData] = generateTestData(seedName, destination, action, false)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)
      nock(/.*/).persist().delete(/.*/).reply(200)

      const event = createTestEvent({
        properties: { ...eventData, timestamp: '2021-07-12T23:02:40.563Z' }
      })

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: { api_key: TEST_API_KEY },
        auth: undefined
      })

      const request = responses[0].request
      const rawBody = await request.text()

      try {
        const json = JSON.parse(rawBody)
        expect(
          json.map(({ timestamp, ...rest }: { timestamp: string; [key: string]: any }) => ({
            ...rest,
            timestamp: '2021-07-12T23:02:40.563Z'
          }))
        ).toMatchSnapshot()
        return
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }
    })
  }
})
