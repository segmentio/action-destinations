import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { ApiRegions } from '../../utils'

const testDestination = createTestIntegration(Destination)

const launchpadAPISecret = 'lp-api-key'
const timestamp = '2023-01-28T15:21:15.449Z'

const mustHaveProps = {
  distinct_id: 'user1234',
  ip: '8.8.8.8',
  properties: {},
  traits: {},
  user_id: 'user1234'
}

describe('Launchpad.trackEvent', () => {
  it('should always return distinct id', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://data.launchpad.pm').post('/capture').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        apiSecret: launchpadAPISecret,
        apiRegion: ApiRegions.EU,
        sourceName: 'segment'
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      event: 'Test Event',
      properties: expect.objectContaining(mustHaveProps)
    })
  })

  it('should default to the EU endpoint if apiRegion setting is undefined', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://data.launchpad.pm').post('/capture').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        apiSecret: launchpadAPISecret,
        sourceName: 'segment'
      }
    })
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      event: 'Test Event',
      properties: expect.objectContaining(mustHaveProps)
    })
  })
})
