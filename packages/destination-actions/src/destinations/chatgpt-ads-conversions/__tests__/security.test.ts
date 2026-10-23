import nock from 'nock'
import { createTestIntegration, RetryableError } from '@segment/actions-core'
import type { JSONObject, RequestClient } from '@segment/actions-core'
import Definition from '../index'
import { sendEvent } from '../client'
import { formatEvent } from '../reportWebEvent/format'

const settings = { pixel_id: 'test-pixel', api_key: 'fake-test-key' }
const base = {
  event_type: 'order_created',
  event_id: 'security-test-event',
  timestamp: '2026-10-20T00:00:00.000Z',
  source_url: 'https://example.com/thank-you'
}
const run = (mapping: JSONObject = {}) =>
  createTestIntegration(Definition).testAction('reportWebEvent', {
    settings,
    mapping: { ...base, ...mapping }
  })

describe('ChatGPT Ads data boundaries', () => {
  beforeAll(() => nock.disableNetConnect())
  afterEach(() => nock.cleanAll())
  afterAll(() => nock.enableNetConnect())

  it('removes URL credentials, query parameters and fragments before sending', async () => {
    const scope = nock('https://bzr.openai.com')
      .post('/v1/events', (body) => {
        expect(body.events[0].source_url).toBe(base.source_url)
        expect(body.events[0].oppref).toBe('opaque-click-reference')
        expect(JSON.stringify(body)).not.toContain('private-marker')
        return true
      })
      .query({ pid: settings.pixel_id })
      .reply(200, { accepted_events: 1 })
    await run({
      source_url:
        'https://private-marker:private-marker@example.com/thank-you?email=private-marker#access_token=private-marker',
      oppref: 'opaque-click-reference'
    })
    expect(scope.isDone()).toBe(true)
  })

  it('drops unknown matching and item fields through the Segment runtime', async () => {
    const scope = nock('https://bzr.openai.com')
      .post('/v1/events', (body) => {
        expect(JSON.stringify(body)).not.toContain('private-marker')
        expect(body.events[0].data.contents).toEqual([{ id: 'sku-1' }])
        return true
      })
      .query(true)
      .reply(200, { accepted_events: 1 })
    await run({
      user_data: { password: 'private-marker', email: 'private-marker@example.com' },
      contents: [{ id: 'sku-1', customer_email: 'private-marker@example.com' }]
    })
    expect(scope.isDone()).toBe(true)
  })

  it('does not forward unmapped Segment traits and custom properties', async () => {
    const scope = nock('https://bzr.openai.com')
      .post('/v1/events', (body) => {
        expect(JSON.stringify(body)).not.toContain('private-marker')
        expect(body.events[0].data).toEqual({ type: 'custom', contents: [] })
        return true
      })
      .query(true)
      .reply(200, { accepted_events: 1 })
    await createTestIntegration(Definition).testAction('reportWebEvent', {
      settings,
      useDefaultMappings: true,
      mapping: { event_type: 'custom', custom_event_name: 'quote_requested' },
      event: {
        type: 'track',
        timestamp: base.timestamp,
        messageId: base.event_id,
        userId: null,
        context: { page: { url: base.source_url }, traits: { password: 'private-marker' } },
        properties: { password: 'private-marker', custom_properties: { secret: 'private-marker' } }
      }
    })
    expect(scope.isDone()).toBe(true)
  })

  it('replaces network error messages and attached request data with a safe retry error', async () => {
    const underlying = Object.assign(new Error('private-marker'), {
      code: 'ECONNRESET',
      options: { headers: { Authorization: 'Bearer private-marker' }, json: { email: 'private-marker' } }
    })
    const request = jest.fn().mockRejectedValue(underlying)
    const error = await sendEvent(request as RequestClient, settings, formatEvent(base)).catch((value: Error) => value)
    expect(error).toBeInstanceOf(RetryableError)
    expect(String(error)).not.toContain('private-marker')
    expect(JSON.stringify(error)).not.toContain('private-marker')
    expect(error).not.toHaveProperty('cause')
    expect(error).not.toHaveProperty('options')
  })

  it('sanitizes a network failure from the real Segment request client', async () => {
    nock('https://bzr.openai.com')
      .post('/v1/events')
      .query(true)
      .replyWithError({ code: 'ECONNRESET', message: 'private-marker' })
    const error = await run().catch((value: Error) => value)
    expect(error).toBeInstanceOf(RetryableError)
    expect(String(error)).not.toContain('private-marker')
  })

  it.each([301, 302, 303, 307, 308])(
    'does not forward credentials or events on HTTP %s redirects',
    async (status: number) => {
      const redirect = nock('https://example.org').post('/collect').reply(200, { accepted_events: 1 })
      nock('https://bzr.openai.com')
        .post('/v1/events')
        .query(true)
        .reply(status, '', { Location: 'https://example.org/collect' })
      await expect(run()).rejects.toMatchObject({ status })
      expect(redirect.isDone()).toBe(false)
    }
  )

  it.each(['key\nprivate-marker', 'key\u0000private-marker', 'key private-marker', 'key\u2028private-marker'])(
    'rejects an invalid key before making a request',
    async (api_key) => {
      const request = jest.fn()
      const error = await sendEvent(request as RequestClient, { ...settings, api_key }, formatEvent(base)).catch(
        (value: Error) => value
      )
      expect(error).toMatchObject({ status: 401 })
      expect(String(error)).not.toContain('private-marker')
      expect(request).not.toHaveBeenCalled()
    }
  )

  it('uses a fixed target and keeps the key out of the URL and event body', async () => {
    const request = jest.fn().mockResolvedValue({ status: 200, data: { accepted_events: 1 } })
    await sendEvent(
      request as RequestClient,
      { ...settings, endpoint: 'https://example.org/collect' } as typeof settings,
      formatEvent(base)
    )
    const [url, options] = request.mock.calls[0]
    expect(url).toBe('https://bzr.openai.com/v1/events')
    expect(options.redirect).toBe('manual')
    expect(options.headers.Authorization).toBe(`Bearer ${settings.api_key}`)
    expect(JSON.stringify({ url, query: options.searchParams, body: options.json })).not.toContain(settings.api_key)
    expect(Definition.authentication?.fields.api_key.type).toBe('password')
  })
})
