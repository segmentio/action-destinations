import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'
import { enquoteIdentifier } from '../operations'

const testDestination = createTestIntegration(destination)
const actionSlug = 'audienceEntered'
const destinationSlug = 'LiverampAudiences'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  beforeAll(() => {
    const mockDate = new Date(12345)
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string)
  })

  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    eventData.delimiter = ','
    settingsData.upload_mode = 'S3'
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const events = new Array(25).fill(0).map(() =>
      createTestEvent({
        properties: eventData
      })
    )

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      mapping: events[0].properties,
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
    eventData.delimiter = ','
    settingsData.upload_mode = 'S3'

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const events = new Array(25).fill(0).map(() =>
      createTestEvent({
        properties: eventData
      })
    )

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      mapping: events[0].properties,
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

  it('missing minimum payload size', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    eventData.delimiter = ','
    settingsData.upload_mode = 'S3'

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    try {
      await testDestination.testBatchAction(actionSlug, {
        events: [event],
        mapping: event.properties,
        settings: settingsData,
        auth: undefined
      })
      throw new Error('expected action to throw')
    } catch (err) {
      expect(err).toMatchSnapshot()
    }
  })

  it('enquotated indentifier data', async () => {
    const identifiers = [`LCD TV,50"`, `"early-bird" special`, `5'8"`]
    const enquotedIdentifiers = identifiers.map(enquoteIdentifier)

    expect(enquotedIdentifiers).toMatchSnapshot()
  })
})
