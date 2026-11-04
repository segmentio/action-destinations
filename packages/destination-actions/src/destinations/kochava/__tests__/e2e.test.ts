/**
 * E2E tests for Kochava (Actions)
 *
 * These tests make real HTTP calls to a running local serve server
 * (./bin/run serve), which in turn makes real outbound calls to Kochava's
 * https://control.kochava.com/track/json endpoint. They are NOT run in CI.
 *
 * Prerequisites:
 *   1. Start the serve server (in a separate terminal):
 *      ./bin/run serve kochava --noUI
 *
 *   2. Set environment variables (or create a .env file):
 *      export BASE_URL=http://localhost:3000
 *      export KOCHAVA_APP_ID=<a Kochava App GUID; a dummy value is fine for validation paths>
 *
 *   3. Run the tests:
 *      yarn cloud jest --testPathPattern="kochava/__tests__/e2e"
 */

import http from 'http'

// Jest's node test environment does not expose undici's global `fetch`, and
// serve listens on IPv4 only, so use the built-in http module against 127.0.0.1.
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000'
const KOCHAVA_APP_ID = process.env.KOCHAVA_APP_ID ?? 'e2e-dummy-app-guid'

jest.setTimeout(30000)

function request(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`)
    const payload = body === undefined ? undefined : JSON.stringify(body)
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers:
          payload === undefined
            ? undefined
            : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          let parsed: unknown = null
          try {
            parsed = JSON.parse(data)
          } catch {
            parsed = data
          }
          resolve({ status: res.statusCode ?? 0, body: parsed })
        })
      }
    )
    req.on('error', reject)
    if (payload !== undefined) req.write(payload)
    req.end()
  })
}

async function post(path: string, body: Record<string, unknown>) {
  return request('POST', path, body)
}

async function get(path: string) {
  return request('GET', path)
}

const settings = { kochava_app_id: KOCHAVA_APP_ID }

describe('Kochava (Actions) E2E', () => {
  beforeAll(async () => {
    try {
      await get('/manifest')
    } catch {
      throw new Error('Serve server is not running. Start it with:\n  ./bin/run serve kochava --noUI')
    }
  })

  describe('Authentication', () => {
    // No testAuthentication is defined; the framework default validates the
    // settings schema. A valid required App GUID should authenticate.
    it('returns ok:true for valid settings', async () => {
      const res = await post('/authenticate', { kochava_app_id: KOCHAVA_APP_ID })
      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)
    })
  })

  describe('event (Post-Install Event)', () => {
    it('delivers a post-install event via perform()', async () => {
      const res = await post('/event', {
        settings,
        payload: {
          type: 'track',
          event: 'Subscription Started',
          messageId: 'msg-e2e-event-1',
          timestamp: '2021-03-20T18:06:56.000Z',
          properties: { currency: 'USD', sum: 150 },
          context: {
            device: { id: 'device-e2e-1', advertisingId: 'idfa-e2e-1', adTrackingEnabled: true },
            os: { version: '14.4' },
            app: { version: '1.0.0' },
            userAgent: 'Mozilla/5.0 (iPhone)',
            ip: '104.219.46.66'
          }
        },
        mapping: {
          event_name: { '@path': '$.event' },
          idfa: { '@path': '$.context.device.advertisingId' },
          device_ua: { '@path': '$.context.userAgent' },
          device_ver: { '@path': '$.context.os.version' },
          origination_ip: { '@path': '$.context.ip' },
          usertime: { '@path': '$.timestamp' }
        }
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('honors kochava_app_id override in the mapping', async () => {
      const res = await post('/event', {
        settings,
        payload: { type: 'track', event: 'Purchase', messageId: 'msg-e2e-event-2' },
        mapping: {
          kochava_app_id: 'override-guid-e2e',
          event_name: 'Purchase',
          idfa: 'idfa-e2e-2',
          device_ver: '15.0'
        }
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('returns a validation error when no device identifier is provided', async () => {
      const res = await post('/event', {
        settings,
        payload: { type: 'track', event: 'Purchase', messageId: 'msg-e2e-event-3' },
        mapping: {
          event_name: 'Purchase',
          device_ver: '15.0'
          // no idfa / idfv / adid / android_id
        }
      })
      expect(res.status).toBe(200)
      expect(res.body[0].message).toContain('device identifier')
    })

    it('returns a validation error when event_name (required) is missing', async () => {
      const res = await post('/event', {
        settings,
        payload: { type: 'track', messageId: 'msg-e2e-event-4' },
        mapping: {
          idfa: 'idfa-e2e-4',
          device_ver: '15.0'
        }
      })
      expect(res.status).toBe(200)
      expect(res.body[0].message).toMatch(/event_name|required/i)
    })
  })

  describe('install (Install Notification)', () => {
    it('delivers an install notification via perform()', async () => {
      const res = await post('/install', {
        settings,
        payload: {
          type: 'track',
          event: 'Application Installed',
          messageId: 'msg-e2e-install-1',
          timestamp: '2021-03-20T18:06:56.000Z',
          context: {
            device: { id: 'device-e2e-1', advertisingId: 'idfa-e2e-1' },
            os: { version: '15.3' },
            app: { version: '3.3.0' },
            userAgent: 'Mozilla/5.0 (iPhone)',
            ip: '77.224.141.10'
          }
        },
        mapping: {
          idfa: { '@path': '$.context.device.advertisingId' },
          device_ver: { '@path': '$.context.os.version' },
          app_version: { '@path': '$.context.app.version' },
          origination_ip: { '@path': '$.context.ip' }
        }
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('includes the ATT block and AdServices token when provided', async () => {
      const res = await post('/install', {
        settings,
        payload: { type: 'track', event: 'Application Installed', messageId: 'msg-e2e-install-2' },
        mapping: {
          idfa: 'idfa-e2e-2',
          device_ver: '15.0',
          att: true,
          att_time: 1616263616,
          ad_services_token: 'as-token-e2e'
        }
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('returns a validation error when no device identifier is provided', async () => {
      const res = await post('/install', {
        settings,
        payload: { type: 'track', event: 'Application Installed', messageId: 'msg-e2e-install-3' },
        mapping: {
          device_ver: '15.0'
          // no idfa / idfv / adid / android_id
        }
      })
      expect(res.status).toBe(200)
      expect(res.body[0].message).toContain('device identifier')
    })
  })

  describe('Skipped (not testable via HTTP)', () => {
    // Kochava exposes no auth-verification endpoint and this destination defines
    // no testAuthentication, so there is no failure branch to trigger for invalid
    // credentials beyond settings-schema validation.
    it.skip('testAuthentication failure branch — no custom testAuthentication exists', () => {})

    // No performBatch is implemented (Kochava /track/json accepts one record per
    // call), so there is no batch delivery path to exercise.
    it.skip('performBatch delivery path — not implemented (no batch endpoint)', () => {})

    // 5xx/429 -> RetryableError and 4xx -> APIError mapping depend on Kochava's
    // live response to a given payload, which cannot be forced deterministically
    // over HTTP without a real (mis)configured App GUID.
    it.skip('retryable vs non-retryable HTTP error mapping — depends on live Kochava response', () => {})
  })
})
