import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = { kochava_app_id: 'ko-app-guid-123' }

describe('Kochava.event', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('sends a post-install event with action "event" and epoch-seconds usertime', async () => {
    nock('https://control.kochava.com').post('/track/json').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Subscription Started',
      timestamp: '2021-03-20T18:06:56.000Z',
      properties: { currency: 'USD', sum: 150 },
      context: {
        device: { id: 'device-1', advertisingId: 'idfa-abc', adTrackingEnabled: true },
        os: { version: '14.4' },
        app: { version: '1.0.0' },
        userAgent: 'Mozilla/5.0 (iPhone)',
        ip: '104.219.46.66'
      }
    })

    const responses = await testDestination.testAction('event', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.action).toBe('event')
    expect(body.kochava_app_id).toBe('ko-app-guid-123')
    expect(body.data.event_name).toBe('Subscription Started')
    expect(body.data.device_ids.idfa).toBe('idfa-abc')
    expect(body.data.usertime).toBe(1616263616)
    // device_ua is URL-encoded
    expect(body.data.device_ua).toBe(encodeURIComponent('Mozilla/5.0 (iPhone)'))
    // ad_tracking_enabled true -> device_limit_tracking false
    expect(body.data.device_limit_tracking).toBe(false)
    expect(body.data.currency).toBe('USD')
  })

  it('overrides the settings App ID with the mapped kochava_app_id', async () => {
    nock('https://control.kochava.com').post('/track/json').reply(200, {})

    const event = createTestEvent({ type: 'track', event: 'Purchase' })

    const responses = await testDestination.testAction('event', {
      event,
      settings,
      mapping: {
        kochava_app_id: 'override-guid',
        event_name: 'Purchase',
        idfa: 'idfa-xyz',
        device_ver: '15.0'
      }
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.kochava_app_id).toBe('override-guid')
    expect(body.data.device_ids.idfa).toBe('idfa-xyz')
  })

  it('throws a validation error when no device identifier is present', async () => {
    const event = createTestEvent({ type: 'track', event: 'Purchase' })

    await expect(
      testDestination.testAction('event', {
        event,
        settings,
        mapping: {
          event_name: 'Purchase',
          idfa: '',
          device_ver: '15.0'
        }
      })
    ).rejects.toThrow('At least one device identifier')
  })
})
