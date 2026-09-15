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

const androidEvent = (appsFlyerOptions: Record<string, unknown> = {}) =>
  createTestEvent({
    type: 'track',
    event: 'Application Opened',
    userId: 'ham',
    properties: {},
    timestamp: '2016-08-03T00:00:00.000Z',
    context: {
      ip: '10.0.0.2',
      device: { type: 'android', advertisingId: '159358MAKEMELOWERCASE', model: 'nexus', adTrackingEnabled: true },
      locale: 'en-US',
      os: { version: '1.0.0' },
      referrer: { url: 'https://google.com/play?af_tranid=1A4F123KJHG73F0P&c=c1&pid=MediaSource1' }
    },
    integrations: {
      AppsFlyer: {
        counter: 3,
        install_date: '2016-12-10T04:08:31.909Z',
        ...appsFlyerOptions
      }
    }
  })

describe('AppsFlyer.applicationOpened', () => {
  afterEach(() => nock.cleanAll())

  it('builds the app-open payload the classic destination sent', async () => {
    nock('https://s2s.appsflyer.com').post('/v2.0/com.segment.analytics.sample').query(true).reply(200, {})

    const responses = await testDestination.testAction('applicationOpened', {
      event: androidEvent(),
      settings,
      useDefaultMappings: true
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body).toMatchObject({
      timestamp: '2016-08-03T00:00:00.000',
      lang: 'en-US',
      os: '1.0.0',
      type: 'nexus',
      aie: 'true',
      // Supplied by the customer — Segment cannot derive either of these.
      inst_date: '2016-12-10T04:08:31.909',
      counter: 3,
      // An app open cannot precede an install, so the user always pre-exists.
      existing_user: 'true',
      advertising_id: '159358makemelowercase',
      appsflyer_id: '159358MAKEMELOWERCASE',
      ip: '10.0.0.2'
    })
  })

  it('sends only the referrer query string, unlike Application Installed', async () => {
    nock('https://s2s.appsflyer.com').post('/v2.0/com.segment.analytics.sample').query(true).reply(200, {})

    const responses = await testDestination.testAction('applicationOpened', {
      event: androidEvent(),
      settings,
      useDefaultMappings: true
    })

    expect(JSON.parse(responses[0].options.body as string).referrer).toBe(
      'af_tranid=1A4F123KJHG73F0P&c=c1&pid=MediaSource1'
    )
  })

  it('reads the deeplink from deep_link, not af_deeplink', async () => {
    nock('https://s2s.appsflyer.com').post('/v2.0/com.segment.analytics.sample').query(true).reply(200, {})

    const responses = await testDestination.testAction('applicationOpened', {
      event: androidEvent({ deep_link: 'myapp://engage?c=someAFcampaign' }),
      settings,
      useDefaultMappings: true
    })

    expect(JSON.parse(responses[0].options.body as string).af_deeplink).toBe('myapp://engage?c=someAFcampaign')
  })

  it('rejects an unparseable install date', async () => {
    await expect(
      testDestination.testAction('applicationOpened', {
        event: androidEvent({ install_date: 'not-a-date' }),
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow(/Install Date must be a valid date-like string/)
  })

  it('requires the counter, which Segment cannot derive', async () => {
    const event = androidEvent()
    delete (event.integrations!.AppsFlyer as Record<string, unknown>).counter

    await expect(
      testDestination.testAction('applicationOpened', { event, settings, useDefaultMappings: true })
    ).rejects.toThrow(/missing the required field 'counter'/)
  })

  it('requires the install date, which Segment cannot derive', async () => {
    const event = androidEvent()
    delete (event.integrations!.AppsFlyer as Record<string, unknown>).install_date

    await expect(
      testDestination.testAction('applicationOpened', { event, settings, useDefaultMappings: true })
    ).rejects.toThrow(/missing the required field 'install_date'/)
  })
})
