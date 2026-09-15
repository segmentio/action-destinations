import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  s2sToken: 'test-s2s-token',
  appleAppID: '822613531',
  androidAppID: 'com.segment.analytics.sample',
  rokuAppID: 'com.segment.analytics.sample'
}

describe('AppsFlyer.trackEvent', () => {
  afterEach(() => nock.cleanAll())

  it('sends an iOS event to the v3 endpoint with the id-prefixed app ID', async () => {
    nock('https://api3.appsflyer.com').post('/inappevent/id822613531').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      event: 'season 2 of stranger things now please',
      userId: 'user-id',
      properties: {},
      timestamp: '2016-08-03T00:00:00.000Z',
      context: {
        ip: '10.0.0.2',
        app: { namespace: 'com.segment.TestApp' },
        device: { type: 'ios', advertisingId: '159358', att: 3 },
        locale: 'en-US',
        os: { version: '1.0.0' }
      },
      integrations: { AppsFlyer: { appsflyer_id: 'gucci-mane' } }
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    const body = JSON.parse(responses[0].options.body as string)
    expect(body).toMatchObject({
      appsflyer_id: 'gucci-mane',
      idfa: '159358',
      bundle_id: 'com.segment.TestApp',
      eventName: 'season 2 of stranger things now please',
      eventCurrency: 'USD',
      eventTime: '2016-08-03 00:00:00.000',
      os: '1.0.0',
      uid: 'user-id',
      af_events_api: 'true',
      att: 3
    })
    // Empty properties must serialize to an empty string, not "{}" — AppsFlyer
    // silently drops the event otherwise.
    expect(body.eventValue).toBe('')
  })

  it('authenticates with the S2S token in the authentication header', async () => {
    nock('https://api3.appsflyer.com').post('/inappevent/id822613531').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      context: { device: { type: 'ios', advertisingId: 'abc' } }
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].request.headers.get('authentication')).toBe('test-s2s-token')
  })

  it('resolves the camelCase appsFlyerId spelling the classic destination also accepted', async () => {
    nock('https://api3.appsflyer.com').post('/inappevent/id822613531').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      context: { device: { type: 'ios', advertisingId: '159358' } },
      integrations: { AppsFlyer: { appsFlyerId: 'camel-case-id' } }
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.appsflyer_id).toBe('camel-case-id')
  })

  it('lowercases the advertising ID on Android', async () => {
    nock('https://api3.appsflyer.com').post('/inappevent/com.segment.analytics.sample').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      context: { device: { type: 'android', advertisingId: '159358MAKEMELOWERCASE' } }
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.advertising_id).toBe('159358makemelowercase')
    expect(body.idfa).toBeUndefined()
  })

  it('sends the advertising ID unchanged on Roku', async () => {
    nock('https://api3.appsflyer.com').post('/inappevent/com.segment.analytics.sample').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      context: { device: { type: 'roku', advertisingId: 'RIDA-Value' } }
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.advertising_id).toBe('RIDA-Value')
  })

  it('quotes every primitive in eventValue and renames revenue', async () => {
    nock('https://api3.appsflyer.com').post('/inappevent/id822613531').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      properties: { revenue: 10, inStock: true, count: 3 },
      context: { device: { type: 'ios', advertisingId: 'abc' } }
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    const body = JSON.parse(responses[0].options.body as string)
    const eventValue = JSON.parse(body.eventValue)
    expect(eventValue).toEqual({ af_revenue: '10', inStock: 'true', count: '3' })
  })

  it('rejects an unsupported device type', async () => {
    const event = createTestEvent({
      type: 'track',
      context: { device: { type: 'web', advertisingId: 'abc' } }
    })

    await expect(
      testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })
    ).rejects.toThrow(/only supports ios, android and roku/)
  })

  it('accepts a mixed-case device type, as the classic destination did', async () => {
    nock('https://api3.appsflyer.com').post('/inappevent/id822613531').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      context: { device: { type: 'iOS', advertisingId: '159358' } }
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.idfa).toBe('159358')
  })

  it('rejects an event with no usable device identifier', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: null,
      anonymousId: null,
      context: { device: { type: 'ios' } }
    })

    await expect(
      testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })
    ).rejects.toThrow(/requires a device identifier/)
  })

  it('rejects a payload over the 1KB AppsFlyer limit', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: { blob: 'x'.repeat(2000) },
      context: { device: { type: 'ios', advertisingId: 'abc' } }
    })

    await expect(
      testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })
    ).rejects.toThrow(/exceeds AppsFlyer's 1024 byte limit/)
  })

  it('requires the app ID for the event device type', async () => {
    const event = createTestEvent({
      type: 'track',
      context: { device: { type: 'android', advertisingId: 'abc' } }
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        settings: { s2sToken: 'test-s2s-token' },
        useDefaultMappings: true
      })
    ).rejects.toThrow(/Android App ID/)
  })
})
