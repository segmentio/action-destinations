import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { SegmentEvent } from '@segment/actions-core'

const launchpadAPISecret = 'lp-api-key'
const timestamp = '2023-01-28T15:21:15.449Z'

const testDestination = createTestIntegration(Destination)

const expectedTraits = {
  email: 'steve@launchpad.pm',
  name: 'Steve Jobs',
  plan: '1',
  group: 'Launchpad',
  title: 'CEO'
}
const testIdentify: SegmentEvent = {
  anonymousId: '947336ec-2294-4813-92e6-fe4a01efbf63',
  integrations: {},
  messageId: 'ajs-next-11e27cb3f0a3e4e8074e9965ed19a151',
  timestamp: timestamp,
  traits: {
    email: 'steve@launchpad.pm',
    name: 'Steve Jobs',
    plan: '1',
    group: 'Launchpad',
    title: 'CEO'
  },
  type: 'identify',
  userId: 'steve@launchpad.pm'
}

describe('Launchpad.identifyUser', () => {
  it('should convert the type and event name', async () => {
    nock('https://data.launchpad.pm').post('/capture').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event: testIdentify,
      useDefaultMappings: true,
      settings: {
        apiSecret: launchpadAPISecret,
        sourceName: 'example segment source name'
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      event: '$identify',
      type: 'screen',
      $set: expect.objectContaining(expectedTraits)
    })
  })

  it('should send segment_source_name property if sourceName setting is defined', async () => {
    nock('https://data.launchpad.pm').post('/capture').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event: testIdentify,
      useDefaultMappings: true,
      settings: {
        apiSecret: launchpadAPISecret,
        sourceName: 'example segment source name'
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      event: '$identify',
      type: 'screen',
      $set: expect.objectContaining(expectedTraits)
    })
  })
})
