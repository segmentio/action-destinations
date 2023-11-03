import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'upsertCustomObjectRecord'
const destinationSlug = 'HubSpot'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(201)
    nock(/.*/).persist().patch(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    try {
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

      expect(request.url).toMatchSnapshot()
    } catch (e) {
      expect(e).toMatchSnapshot()
    }
  })

  it('all fields', async () => {
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(201)
    nock(/.*/).persist().patch(/.*/).reply(200)

    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

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
    expect(request.url).toMatchSnapshot()
  })
})
