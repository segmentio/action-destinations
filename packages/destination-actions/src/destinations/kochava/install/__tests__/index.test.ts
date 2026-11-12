import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = { kochava_app_id: 'ko-app-guid-123' }

describe('Kochava.install', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('sends an install notification with action "install" and device ids', async () => {
    nock('https://control.kochava.com').post('/track/json').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Application Installed',
      timestamp: '2021-03-20T18:06:56.000Z',
      context: {
        device: { id: 'device-1', advertisingId: 'idfa-abc' },
        os: { version: '15.3' },
        app: { version: '3.3.0' },
        userAgent: 'Mozilla/5.0 (iPhone)',
        ip: '77.224.141.10'
      }
    })

    const responses = await testDestination.testAction('install', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.action).toBe('install')
    expect(body.kochava_app_id).toBe('ko-app-guid-123')
    expect(body.data.device_ids.idfa).toBe('idfa-abc')
    expect(body.data.device_ver).toBe('15.3')
    expect(body.data.app_version).toBe('3.3.0')
    // install has no event_name
    expect(body.data.event_name).toBeUndefined()
  })

  it('includes the App Tracking Transparency block and AdServices token when provided', async () => {
    nock('https://control.kochava.com').post('/track/json').reply(200, {})

    const event = createTestEvent({ type: 'track', event: 'Application Installed' })

    const responses = await testDestination.testAction('install', {
      event,
      settings,
      mapping: {
        idfa: 'idfa-xyz',
        device_ver: '15.0',
        att: true,
        att_time: 1616263616,
        ad_services_token: 'as-token-1'
      }
    })

    const body = JSON.parse(responses[0].options.body as string)
    expect(body.data.app_tracking_transparency).toEqual({
      att: true,
      att_time: 1616263616,
      att_duration: undefined,
      att_detail: undefined
    })
    expect(body.data.ad_services_token).toBe('as-token-1')
  })

  it('throws a validation error when no device identifier is present', async () => {
    const event = createTestEvent({ type: 'track', event: 'Application Installed' })

    await expect(
      testDestination.testAction('install', {
        event,
        settings,
        mapping: {
          idfa: '',
          device_ver: '15.0'
        }
      })
    ).rejects.toThrow('At least one device identifier')
  })
})
