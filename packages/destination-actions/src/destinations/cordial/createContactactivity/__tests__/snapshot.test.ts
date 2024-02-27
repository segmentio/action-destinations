import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'createContactactivity'
const destinationSlug = 'Cordial'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  afterEach(() => nock.cleanAll())
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/)
      .persist()
      .post(/\/.*\/createContactactivity/)
      .reply(200)

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

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/)
      .persist()
      .post(/\/.*\/createContactactivity/)
      .reply(200)

    const event = createTestEvent({
      properties: eventData,
      sentAt: '2022-04-04T13:08:53.205Z'
    })

    const mapping = {
      userIdentities: { 'channels.email.address': 'contact@example.com' },
      action: {
        '@path': '$.event'
      },
      time: {
        '@path': '$.sentAt'
      },
      properties: {
        '@path': '$.properties'
      },
      context: {
        '@path': '$.context'
      }
    }

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: mapping,
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
