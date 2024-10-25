import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import { DEFAULT_SEGMENT_ENDPOINT } from '../../properties'

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendPage'
const destinationSlug = 'Segment'
const seedName = `${destinationSlug}#${actionSlug}`

const settingsData = {
  source_write_key: 'test-source-write-key',
  endpoint: DEFAULT_SEGMENT_ENDPOINT
}

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, _] = generateTestData(seedName, destination, action, true)

    const event = createTestEvent({
      properties: eventData
    })

    await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const results = testDestination.results
    expect(results[results.length - 1]).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, _] = generateTestData(seedName, destination, action, false)

    const event = createTestEvent({
      properties: eventData
    })

    await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const results = testDestination.results
    expect(results[results.length - 1]).toMatchSnapshot()
  })
})
