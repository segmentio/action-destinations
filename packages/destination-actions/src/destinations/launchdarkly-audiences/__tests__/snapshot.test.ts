import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-launchdarkly-audiences'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
      eventData['custom_audience_name'] = 'test_audience'
      eventData['segment_computation_action'] = 'audience'
      eventData['traits_or_props'] = { [eventData['custom_audience_name']]: true }

      setStaticDataForSnapshot(eventData, 'context_kind', 'customContextKind')
      setStaticDataForSnapshot(eventData, 'context_key', 'user-id')

      setStaticDataForSnapshot(settingsData, 'clientId', 'environment-id')
      setStaticDataForSnapshot(settingsData, 'apiKey', 'api-key')

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

      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()

      expect(request.headers).toMatchSnapshot()
    })
  }
})

/**
 * Sets data used in snapshot tests to a static value to prevent snapshots from failing. Will only
 * set override the value if its already set.
 */
const setStaticDataForSnapshot = (data: any, fieldName: string, staticValue: string) => {
  if (data[fieldName]) {
    data[fieldName] = staticValue
  }
  return data
}
