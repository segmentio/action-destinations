import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'addContactToList'
const destinationSlug = 'Cordial'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  afterEach(() => nock.cleanAll())
  it('default fields, group name', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/)
      .post(/\/.*\/addContactToList/)
      .reply(200, {})

    const event = createTestEvent({
      properties: eventData,
      groupId: 'group1234',
      traits: {
        name: 'test group'
      }
    })

    // static anonId
    event.anonymousId = "373d36f4-985b-44bf-89ce-a7be430a583d"

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
      .post(/\/.*\/addContactToList/)
      .reply(200, {})

    const event = createTestEvent({
      properties: eventData,
      groupId: 'group1234'
    })

    // static anonId
    event.anonymousId = "985b44bf-09ce-47be-830a-583d54d049cb"

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
