import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import prettier from 'prettier'
import nock from 'nock'

const testDestination = createTestIntegration(destination)

describe('Testing snapshot for {{destination}} action:', () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} [required]`, async () => {
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(destination, action, true)

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

      expect(request.headers).toMatchSnapshot()

      if (request.body) {
        const bodyString = decodeURIComponent(request.body.toString())
        if (bodyString[0] === '{') {
          expect(prettier.format(request.body.toString(), { parser: 'json' })).toMatchSnapshot()
        } else {
          expect(request.body.toString()).toMatchSnapshot()
        }
      }
    })

    it(`${actionSlug} [all fields]`, async () => {
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(destination, action, false)

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

      if (request.body) {
        const bodyString = decodeURIComponent(request.body.toString())
        if (bodyString[0] === '{') {
          expect(prettier.format(request.body.toString(), { parser: 'json' })).toMatchSnapshot()
        } else {
          expect(request.body.toString()).toMatchSnapshot()
        }
      }
    })
  }
})
