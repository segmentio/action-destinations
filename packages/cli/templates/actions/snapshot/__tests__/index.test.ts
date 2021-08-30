import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { Settings } from '../../generated-types'
import nock from 'nock'
import Destination from '../../index'
import { generateTestData } from '../../../../../../cli/src/lib/test-data'
import action from '../index'
import destination from '../../index'

const testDestination = createTestIntegration(Destination)

beforeAll(() => {
  // Disable external network requests
  nock.disableNetConnect()
  // But allow localhost connections so we can test local routes and mock servers.
  nock.enableNetConnect('127.0.0.1')

  if (!nock.isActive()) {
    nock.activate()
  }
})

describe('{{destination}}.{{action}}', () => {
  it('should test snapshot', async () => {
    const actionSlug = '{{action}}'

    const [eventData, settingsData] = generateTestData(destination, action)

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

    expect(responses[0].status).toBe(200)

    const requestBody = responses[0].request.body
    if (requestBody) {
      expect(requestBody.toString()).toMatchInlineSnapshot()
    }
  })
})
