// eslint-disable-next-line no-var
var sftpPut = jest.fn().mockImplementation((args) => args)

import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'
import { enquoteIdentifier } from '../operations'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'LiverampAudiences'

jest.mock('ssh2-sftp-client', () => {
  const sftpClient = {
    put: sftpPut,
    connect: jest.fn(),
    end: jest.fn()
  }
  return jest.fn(() => sftpClient)
})

describe(`Testing snapshot for ${destinationSlug}'s audienceEnteredS3 destination action:`, () => {
  const actionSlug = 'audienceEnteredS3'
  const seedName = `${destinationSlug}#${actionSlug}`
  beforeAll(() => {
    const mockDate = new Date(12345)
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string)
  })

  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    eventData.delimiter = ','
    eventData.s3_aws_access_key = '12345'
    eventData.s3_aws_secret_key = '12345'
    eventData.s3_aws_bucket_name = 'bucket'
    eventData.s3_aws_region = 'us-west'
    eventData.filename = 'myfile'

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
    eventData.s3_aws_access_key = '12345'
    eventData.s3_aws_secret_key = '12345'
    eventData.s3_aws_bucket_name = 'bucket'
    eventData.s3_aws_region = 'us-west'
    eventData.filename = 'myfile'

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
})

describe(`Testing snapshot for ${destinationSlug}'s audienceEnteredSFTP destination action:`, () => {
  const actionSlug = 'audienceEnteredSFTP'
  const seedName = `${destinationSlug}#${actionSlug}`
  beforeAll(() => {
    const mockDate = new Date(12345)
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string)
  })

  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    eventData.delimiter = ','
    eventData.sftp_username = '12345'
    eventData.sftp_password = '12345'
    eventData.sftp_folder_path = 'path'
    eventData.filename = 'myfile'

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const events = new Array(25).fill(0).map(() =>
      createTestEvent({
        properties: eventData
      })
    )

    await testDestination.testBatchAction(actionSlug, {
      events,
      mapping: events[0].properties,
      settings: settingsData,
      auth: undefined
    })

    expect(sftpPut.mock.calls).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    eventData.delimiter = ','
    eventData.sftp_username = '12345'
    eventData.sftp_password = '12345'
    eventData.sftp_folder_path = 'path'
    eventData.filename = 'myfile'

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const events = new Array(25).fill(0).map(() =>
      createTestEvent({
        properties: eventData
      })
    )

    await testDestination.testBatchAction(actionSlug, {
      events,
      mapping: events[0].properties,
      settings: settingsData,
      auth: undefined
    })

    expect(sftpPut.mock.calls).toMatchSnapshot()
  })

  it('missing minimum payload size', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    eventData.delimiter = ','

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
})

describe(`Testing snapshot for ${destinationSlug}'s generic functions:`, () => {
  it('enquotated indentifier data', async () => {
    const identifiers = [`LCD TV,50"`, `"early-bird" special`, `5'8"`]
    const enquotedIdentifiers = identifiers.map(enquoteIdentifier)

    expect(enquotedIdentifiers).toMatchSnapshot()
  })
})
