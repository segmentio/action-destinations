import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
import { hubSpotBaseURL } from '../../properties'

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendCustomBehavioralEvent'
const destinationSlug = 'Hubspot'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(hubSpotBaseURL).persist().post('/events/v3/send').reply(204)

    // one of email, user token or objectID is required
    const event = createTestEvent({
      properties: { ...eventData, email: 'hello@world.com' }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const json = await request.json()

    expect(json).toMatchSnapshot()

    expect(request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(hubSpotBaseURL).persist().post('/events/v3/send').reply(200)

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
    const json = await request.json()
    expect(json).toMatchSnapshot()
  })
})
