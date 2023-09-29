import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendTrack'
const destinationSlug = 'Segment'
const seedName = `${destinationSlug}#${actionSlug}`

const settingsData = {
  source_write_key: 'test-source-write-key'
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

    expect(testDestination.results).toMatchSnapshot()
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

    expect(testDestination.results).toMatchSnapshot()
  })
})
