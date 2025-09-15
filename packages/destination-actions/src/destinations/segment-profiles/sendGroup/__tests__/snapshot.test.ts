import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendGroup'
const destinationSlug = 'SegmentProfiles'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    const event = createTestEvent({
      properties: eventData
    })

    await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: { ...settingsData },
      auth: undefined
    })

    const results = testDestination.results
    expect(results[results.length - 1]).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    const event = createTestEvent({
      properties: eventData
    })

    await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: { ...settingsData },
      auth: undefined
    })

    const results = testDestination.results
    expect(results[results.length - 1]).toMatchSnapshot()
  })
})
