import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
<<<<<<< HEAD
import { HubSpotBaseURL } from '../../properties'
=======
import { hubSpotBaseURL } from '../../properties'
>>>>>>> CONMAN-199

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendCustomBehavioralEvent'
const destinationSlug = 'Hubspot'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

<<<<<<< HEAD
    nock(HubSpotBaseURL).persist().post('/events/v3/send').reply(204)
=======
    nock(hubSpotBaseURL).persist().post('/events/v3/send').reply(204)
>>>>>>> CONMAN-199

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
<<<<<<< HEAD
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
=======
    const json = await request.json()

    expect(json).toMatchSnapshot()
>>>>>>> CONMAN-199

    expect(request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

<<<<<<< HEAD
    nock(HubSpotBaseURL).persist().post('/events/v3/send').reply(200)
=======
    nock(hubSpotBaseURL).persist().post('/events/v3/send').reply(200)
>>>>>>> CONMAN-199

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
<<<<<<< HEAD
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
=======
    const json = await request.json()
    expect(json).toMatchSnapshot()
>>>>>>> CONMAN-199
  })
})
