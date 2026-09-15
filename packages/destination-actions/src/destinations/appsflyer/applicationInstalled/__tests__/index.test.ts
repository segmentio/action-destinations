import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  s2sToken: 'test-s2s-token',
  devKey: 'test-dev-key-not-a-real-secret',
  appleAppID: '822613531',
  androidAppID: 'com.segment.analytics.sample',
  rokuAppID: 'com.segment.analytics.sample'
}

// HMAC-SHA256 of "2016-08-03T00:00:00.000" + "8.8.8.8" + "en-US", keyed with the dev key above.
const EXPECTED_AF_SIG = 'e96ea54598acf8c2c67feeeb863c7508c932c71d2b4fe13f06ad02161c170826'

const iosEvent = () =>
  createTestEvent({
    type: 'track',
    event: 'Application Installed',
    anonymousId: 'ham',
    properties: {},
    timestamp: '2016-08-03T00:00:00.000Z',
    context: {
      app: { namespace: 'com.production.segment' },
      device: {
        id: 'B5372DB0-C21E-11E4-8DFC-AA07A5B093DB',
        advertisingId: '7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB',
        adTrackingEnabled: true,
        model: 'iPhone7,2',
        type: 'ios',
        att: 3
      },
      ip: '8.8.8.8',
      locale: 'en-US',
      os: { version: '8.1.3' },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X)'
    }
  })

describe('AppsFlyer.applicationInstalled', () => {
  afterEach(() => nock.cleanAll())

  it('posts to the S2S endpoint with the correct af_sig signature', async () => {
    nock('https://s2s.appsflyer.com').post('/v2.0/id822613531').query({ af_sig: EXPECTED_AF_SIG }).reply(200, {})

    const responses = await testDestination.testAction('applicationInstalled', {
      event: iosEvent(),
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].url).toContain(`af_sig=${EXPECTED_AF_SIG}`)
  })

  it('builds the install payload the classic destination sent', async () => {
    nock('https://s2s.appsflyer.com').post('/v2.0/id822613531').query(true).reply(200, {})

    const responses = await testDestination.testAction('applicationInstalled', {
      event: iosEvent(),
      settings,
      useDefaultMappings: true
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body).toMatchObject({
      timestamp: '2016-08-03T00:00:00.000',
      lang: 'en-US',
      ip: '8.8.8.8',
      os: '8.1.3',
      type: 'iPhone7,2',
      aie: 'true',
      inst_date: '2016-08-03T00:00:00.000',
      // An install is by definition the first open, and the user cannot pre-exist.
      counter: 1,
      existing_user: 'false',
      bundle_id: 'com.production.segment',
      idfa: '7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB',
      appsflyer_id: '7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB',
      att: 3
    })
  })

  it('sends aie false only when ad tracking is explicitly disabled', async () => {
    nock('https://s2s.appsflyer.com').post('/v2.0/id822613531').query(true).reply(200, {})

    const event = iosEvent()
    event.context!.device.adTrackingEnabled = false

    const responses = await testDestination.testAction('applicationInstalled', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(JSON.parse(responses[0].options.body as string).aie).toBe('false')
  })

  it('remaps Google Play referrer keys on Android', async () => {
    nock('https://s2s.appsflyer.com').post('/v2.0/com.segment.analytics.sample').query(true).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Application Installed',
      timestamp: '2016-08-03T00:00:00.000Z',
      context: {
        device: { type: 'android', advertisingId: 'GAID-VALUE' },
        ip: '8.8.8.8',
        locale: 'en-US'
      },
      integrations: {
        AppsFlyer: {
          referrers: [
            {
              source: 'google-play',
              install_referrer: 'utm_source=test',
              referrer_click_timestamp_seconds: 1234,
              install_begin_timestamp_seconds: 5678
            }
          ]
        }
      }
    })

    const responses = await testDestination.testAction('applicationInstalled', {
      event,
      settings,
      useDefaultMappings: true
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.referrers).toEqual([
      { source: 'google-play', referrer: 'utm_source=test', click_ts: 1234, install_begin_ts: 5678 }
    ])
    expect(body.advertising_id).toBe('gaid-value')
  })

  it('sends the full referrer URL, unlike Application Opened', async () => {
    nock('https://s2s.appsflyer.com').post('/v2.0/com.segment.analytics.sample').query(true).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Application Installed',
      timestamp: '2016-08-03T00:00:00.000Z',
      context: {
        device: { type: 'android', advertisingId: 'gaid' },
        ip: '8.8.8.8',
        locale: 'en-US',
        referrer: { url: 'https://google.com/play?af_tranid=ABC&c=c1' }
      }
    })

    const responses = await testDestination.testAction('applicationInstalled', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(JSON.parse(responses[0].options.body as string).referrer).toBe('https://google.com/play?af_tranid=ABC&c=c1')
  })

  it('requires the dev key to sign the request', async () => {
    await expect(
      testDestination.testAction('applicationInstalled', {
        event: iosEvent(),
        settings: { s2sToken: 'x', appleAppID: '822613531' },
        useDefaultMappings: true
      })
    ).rejects.toThrow(/Dev Key/)
  })
})
