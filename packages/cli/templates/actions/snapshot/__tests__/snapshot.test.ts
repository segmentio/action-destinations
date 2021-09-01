import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { Settings } from '../generated-types'
import nock from 'nock'
import generateTestData from '@segment/action-destinations/src/lib/test-data'
import destination from '../index'

const testDestination = createTestIntegration(destination)

describe('Testing snapshot for {{destination}} action:', () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} [required]`, async () => {
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(destination, action, 'required')

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({
        properties: eventData
      })

      const responses = await testDestination.testAction(actionSlug, {
        event,
        settings: settingsData as Settings,
        mapping: event.properties,
        useDefaultMappings: false
      })

      const requestBody = responses[0].request.body
      if (requestBody) {
        expect(requestBody.toString()).toMatchSnapshot()
      }
    })

    it(`${actionSlug} [all fields]`, async () => {
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(destination, action, 'all')

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({
        properties: eventData
      })

      const responses = await testDestination.testAction(actionSlug, {
        event,
        settings: settingsData as Settings,
        mapping: event.properties,
        useDefaultMappings: false
      })

      const requestBody = responses[0].request.body
      if (requestBody) {
        expect(requestBody.toString()).toMatchSnapshot()
      }
    })
  }
})
