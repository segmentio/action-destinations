import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'upsertContact'
const destinationSlug = 'Cordial'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/)
      .post(/\/.*\/contacts/)
      .reply(200, {})
    nock(/.*/)
      .get(/\/.*\/accountcontactattributes/)
      .reply(200, [])

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
      .post(/\/.*\/contacts/)
      .reply(200, {})
    nock(/.*/)
      .get(/\/.*\/accountcontactattributes/)
      .reply(200, {
        testType: {
          name: 'test type',
          key: 'testType',
          type: 'string'
        }
      })

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[1].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
  })

  it('skip objects', async () => {
    const action = destination.actions[actionSlug]
    const [, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/)
      .post(/\/.*\/contacts/)
      .reply(200, {})
    nock(/.*/)
      .get(/\/.*\/accountcontactattributes/)
      .reply(200, {
        attribute1: {
          name: 'Attribute 1',
          key: 'attribute1',
          type: 'string'
        },
        attribute2: {
          name: 'Attribute 2',
          key: 'attribute2',
          type: 'string'
        },
        attribute3: {
          name: 'Attribute 3',
          key: 'attribute3',
          type: 'string'
        }
      })

    const event = createTestEvent({
      traits: {
        attribute1: 'string',
        attribute2: { foo: 'bar' },
        attribute3: [1, 2, 3]
      }
    })

    const mapping = {
      identifyByKey: 'email'
    }

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping,
      settings: settingsData,
      useDefaultMappings: true,
      auth: undefined
    })

    const request = responses[1].request
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
