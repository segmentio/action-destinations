import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { Features } from '@segment/actions-core/mapping-kit'
import Destination from '../../index'
import { ApiRegions, StrictMode, FLAGS } from '../../common/utils'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'
const MIXPANEL_API_SECRET = 'test-api-secret'
const timestamp = '2021-08-17T15:21:15.449Z'

// Expected Basic auth header values for the /import endpoint: `Basic base64("<credential>:")`.
const projectTokenAuth = `Basic ${Buffer.from(`${MIXPANEL_PROJECT_TOKEN}:`).toString('base64')}`
const apiSecretAuth = `Basic ${Buffer.from(`${MIXPANEL_API_SECRET}:`).toString('base64')}`

const expectedProperties = {
  ip: '8.8.8.8',
  distinct_id: 'user1234',
  $anon_id: 'anonId1234',
  $device_id: 'anonId1234',
  $identified_id: 'user1234',
  $current_url: 'https://segment.com/academy/',
  $locale: 'en-US',
  mp_country_code: 'United States',
  mp_lib: 'Segment Actions: analytics.js'
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

  it('should use IN server URL', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api-in.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiRegion: ApiRegions.IN
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
        projectToken: MIXPANEL_PROJECT_TOKEN
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
        projectToken: MIXPANEL_PROJECT_TOKEN
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

  it('should use strict mode end point by default', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
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

  it('should use strict mode end point when the strict mode setting is on', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiRegion: ApiRegions.US,
        strictMode: StrictMode.ON
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

  it('should not use strict mode end point when the strict mode setting is off', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api.mixpanel.com').post('/import?strict=0').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiRegion: ApiRegions.US,
        strictMode: StrictMode.OFF
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

  it('should allow an empty, but present, distinct_id', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN
      },
      useDefaultMappings: true,
      mapping: {
        distinct_id: '' // Map an empty distinct_id for the action.
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Test Event',
        properties: expect.objectContaining({
          ...expectedProperties,
          distinct_id: '' // Expect an empty string `distinct_id` returned.
        })
      }
    ])
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

describe('Mixpanel.trackEvent /import auth credential', () => {
  // nock only matches the request when the authorization header equals the expected credential, so a
  // 200 response (responses.length === 1) proves the correct Basic-auth credential was sent.
  const runExpectingAuth = async (expectedAuth: string, settings: Record<string, unknown>, features?: Features) => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })
    nock('https://api.mixpanel.com').post('/import?strict=1').matchHeader('authorization', expectedAuth).reply(200, {})
    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: settings as never,
      features
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  }

  it('uses the API secret when the project-token-auth flag is OFF', async () => {
    await runExpectingAuth(apiSecretAuth, {
      projectToken: MIXPANEL_PROJECT_TOKEN,
      apiSecret: MIXPANEL_API_SECRET,
      apiRegion: ApiRegions.US
    })
  })

  it('uses the project token when the project-token-auth flag is ON', async () => {
    await runExpectingAuth(
      projectTokenAuth,
      {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.US
      },
      { [FLAGS.PROJECT_TOKEN_AUTH]: true }
    )
  })

  it('falls back to the project token when the flag is OFF and no API secret is set', async () => {
    await runExpectingAuth(projectTokenAuth, {
      projectToken: MIXPANEL_PROJECT_TOKEN,
      apiRegion: ApiRegions.US
    })
  })
})
