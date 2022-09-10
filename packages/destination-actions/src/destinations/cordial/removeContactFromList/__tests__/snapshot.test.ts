import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'removeContactFromList'
const destinationSlug = 'Cordial'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  afterEach(() => nock.cleanAll())
  it('default fields, group name', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/)
      .post(/\/.*\/removeContactFromList/)
      .reply(200, {})

    const event = createTestEvent({
      properties: eventData,
      groupId: 'group1234',
      traits: {
        name: 'test group'
      }
    })

    // static anonId
    event.anonymousId = "4251ed2f-f91d-4805-8a5b-a8a575439604"

    const mapping = {
      userIdentities: {'channels.email.address': 'contact@example.com'}
    }

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping,
      settings: settingsData,
      useDefaultMappings: true,
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

  it('default fields, group id only', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/)
      .post(/\/.*\/removeContactFromList/)
      .reply(200, {})

    const event = createTestEvent({
      properties: eventData,
      groupId: 'group1234'
    })

    // static anonId
    event.anonymousId = "f91d0805-0a5b-48a5-b543-96045ce7049a"

    const mapping = {
      userIdentities: {'channels.email.address': 'contact@example.com'}
    }

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping,
      settings: settingsData,
      useDefaultMappings: true,
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
