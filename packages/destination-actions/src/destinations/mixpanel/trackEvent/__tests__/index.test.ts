import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { ApiRegions } from '../../utils'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'
const timestamp = '2021-08-17T15:21:15.449Z'

const expectedProperties = {
  ip: '8.8.8.8',
  distinct_id: 'user1234',
  $anon_id: 'anonId1234',
  $identified_id: 'user1234',
  $current_url: 'https://segment.com/academy/',
  $locale: 'en-US',
  mp_country_code: 'United States',
  mp_lib: 'Segment: analytics.js'
}

describe('Mixpanel.trackEvent', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.US
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Test Event',
        properties: expect.objectContaining(expectedProperties)
      }
    ])
  })

  it('should use EU server URL', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api-eu.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.EU
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Test Event',
        properties: expect.objectContaining(expectedProperties)
      }
    ])
  })

  it('should default to US endpoint if apiRegion setting is undefined', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Test Event',
        properties: expect.objectContaining(expectedProperties)
      }
    ])
  })

  it('should send segment_source_name property if sourceName setting is defined', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        sourceName: 'example segment source name'
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Test Event',
        properties: expect.objectContaining({
          segment_source_name: 'example segment source name'
        })
      }
    ])
  })

  it('should not send segment_source_name property if sourceName setting is undefined', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Test Event',
        properties: expect.objectContaining({
          segment_source_name: undefined
        })
      }
    ])
  })

  it('should require event field', async () => {
    const event = createTestEvent({ timestamp })
    event.event = undefined

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    try {
      await testDestination.testAction('trackEvent', { event, useDefaultMappings: true })
    } catch (e) {
      expect(e.message).toBe("The root value is missing the required field 'event'.")
    }
  })

  it('should invoke performBatch for batches', async () => {
    const events = [
      createTestEvent({ timestamp, event: 'Test Event1' }),
      createTestEvent({ timestamp, event: 'Test Event2' })
    ]

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testBatchAction('trackEvent', {
      events,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.US
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Test Event1',
        properties: expect.objectContaining(expectedProperties)
      },
      {
        event: 'Test Event2',
        properties: expect.objectContaining(expectedProperties)
      }
    ])
  })
})
