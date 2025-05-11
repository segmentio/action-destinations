import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'identifyUser2'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination V2 action:`, () => {
  it('fails if sync mode is delete', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    const event = createTestEvent({
      properties: eventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: { ...event.properties, __segment_internal_sync_mode: 'delete' },
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowError('syncMode must be "add" or "upsert"')
  })

  it('fails if sync mode is update', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    const event = createTestEvent({
      properties: eventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: { ...event.properties, __segment_internal_sync_mode: 'update' },
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowError('syncMode must be "add" or "upsert"')
  })

  it('snapshot with all fields', async () => {
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
      mapping: { ...event.properties, __segment_internal_sync_mode: 'add' },
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
})
