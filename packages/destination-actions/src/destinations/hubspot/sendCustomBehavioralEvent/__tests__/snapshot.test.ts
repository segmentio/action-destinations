import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
import { HUBSPOT_BASE_URL } from '../../properties'

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendCustomBehavioralEvent'
const destinationSlug = 'HubSpot'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData] = generateTestData(seedName, destination, action, true)

    nock(HUBSPOT_BASE_URL).persist().post('/events/v3/send').reply(204)

    // one of email, user token or objectID is required
    const event = createTestEvent({
      properties: { ...eventData, email: 'hello@world.com' }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      auth: undefined
    })

    const request = responses[0].request
    const json = await request.json()

    expect(json).toMatchSnapshot()

    expect(request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData] = generateTestData(seedName, destination, action, false)

    nock(HUBSPOT_BASE_URL).persist().post('/events/v3/send').reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      auth: undefined
    })

    const request = responses[0].request
    const json = await request.json()
    expect(json).toMatchSnapshot()
  })
})
