import nock from 'nock'
import { createTestEvent, createTestIntegration, defaultValues } from '@segment/actions-core'
import Definition from '../index'
import sendEvent from '../sendEvent'
import { ENVIRONMENTS, INTEGRATION_HEADER_VALUE, MAX_BATCH_BYTES, MAX_BATCH_SIZE } from '../versioning-info'

const testDestination = createTestIntegration(Definition)

const settings = { apiKey: 'test-api-key', environment: 'production' }
const mapping = defaultValues(sendEvent.fields)
const baseUrl = ENVIRONMENTS.production
const stagingUrl = ENVIRONMENTS.staging

const trackEvent = createTestEvent({
  type: 'track',
  event: 'Order Completed',
  messageId: 'msg-123',
  anonymousId: 'anon-abc',
  userId: 'user-42',
  timestamp: '2026-09-10T20:00:00.000Z',
  context: {
    ip: '203.0.113.9',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    page: { url: 'https://shop.example.com/checkout', referrer: 'https://www.google.com/' },
    traits: { email: 'Example@Example.com ' }
  },
  properties: { order_id: 9001, total: 149.99, currency: 'USD' }
})

describe('Tatari Web Events', () => {
  afterEach(() => nock.cleanAll())

  describe('settings validation', () => {
    it('rejects settings without an apiKey', async () => {
      await expect(
        testDestination.testAuthentication({ environment: 'production' } as typeof settings)
      ).rejects.toThrowError()
    })

    it('rejects an environment outside the allowed choices', async () => {
      await expect(testDestination.testAuthentication({ apiKey: 'k', environment: 'dev' })).rejects.toThrowError()
    })
  })

  describe('environment routing', () => {
    it('sends to production by default', async () => {
      const scope = nock(baseUrl).post('/webevents/v1/track').reply(200, {})

      await testDestination.testAction('sendEvent', { event: trackEvent, settings, useDefaultMappings: true })

      expect(scope.isDone()).toBe(true)
    })

    it('sends single events to staging when selected', async () => {
      const prod = nock(baseUrl).post('/webevents/v1/track').reply(200, {})
      const staging = nock(stagingUrl).post('/webevents/v1/track').reply(200, {})

      await testDestination.testAction('sendEvent', {
        event: trackEvent,
        settings: { ...settings, environment: 'staging' },
        useDefaultMappings: true
      })

      expect(staging.isDone()).toBe(true)
      expect(prod.isDone()).toBe(false)
    })

    it('sends batches to staging when selected', async () => {
      const prod = nock(baseUrl).post('/webevents/v1/batch').reply(200, {})
      const staging = nock(stagingUrl).post('/webevents/v1/batch').reply(200, { accepted_count: 1, rejected_count: 0 })

      await testDestination.executeBatch('sendEvent', {
        events: [trackEvent],
        settings: { ...settings, environment: 'staging' },
        mapping
      })

      expect(staging.isDone()).toBe(true)
      expect(prod.isDone()).toBe(false)
    })

    it('falls back to production when environment is missing from settings', async () => {
      const scope = nock(baseUrl).post('/webevents/v1/track').reply(200, {})

      await testDestination.testAction('sendEvent', {
        event: trackEvent,
        settings: { apiKey: 'k' } as typeof settings,
        useDefaultMappings: true
      })

      expect(scope.isDone()).toBe(true)
    })
  })

  describe('sendEvent.perform', () => {
    it('sends auth + integration headers and a well-formed single event', async () => {
      let sentBody: Record<string, unknown> = {}
      nock(baseUrl, {
        reqheaders: {
          'x-api-key': 'test-api-key',
          'x-vault-api-integration': INTEGRATION_HEADER_VALUE,
          'content-type': 'application/json'
        }
      })
        .post('/webevents/v1/track', (body) => {
          sentBody = body
          return true
        })
        .reply(200, { status: 'success' })

      const responses = await testDestination.testAction('sendEvent', {
        event: trackEvent,
        settings,
        useDefaultMappings: true
      })

      expect(responses[0].status).toBe(200)
      expect(sentBody).toEqual({
        event: 'Order Completed',
        event_dt: '2026-09-10T20:00:00.000Z',
        session_id: 'anon-abc',
        user_id: 'user-42',
        distinct_id: 'msg-123',
        ipv4: '203.0.113.9',
        user_agent: 'Mozilla/5.0 (Macintosh)',
        url: 'https://shop.example.com/checkout',
        referrer_url: 'https://www.google.com/',
        // hashes of "example@example.com"
        hem_sha256: '31c5543c1734d25c7206f5fd591525d0295bec6fe84ff82f946a34fe970a1e66',
        hem_sha1: '914fec35ce8bfa1a067581032f26b053591ee38a',
        hem_md5: '23463b99b62a72f26ed677cc556c44e8',
        args: { order_id: '9001', order_total: 149.99, currency: 'USD' }
      })
    })

    it('drops properties already promoted to dedicated fields from args', async () => {
      let sentBody: Record<string, unknown> = {}
      nock(baseUrl)
        .post('/webevents/v1/track', (body) => {
          sentBody = body
          return true
        })
        .reply(200, {})

      await testDestination.testAction('sendEvent', {
        event: createTestEvent({
          ...trackEvent,
          context: { ip: '203.0.113.9', userAgent: 'UA' },
          properties: {
            order_id: 'ORD-555',
            revenue: '120.50',
            url: 'https://shop.example.com/confirmation',
            referrer: 'https://shop.example.com/cart',
            currency: 'USD'
          }
        }),
        settings,
        useDefaultMappings: true
      })

      expect(sentBody.url).toBe('https://shop.example.com/confirmation')
      expect(sentBody.referrer_url).toBe('https://shop.example.com/cart')
      expect(sentBody.args).toEqual({ order_id: 'ORD-555', order_total: 120.5, currency: 'USD' })
    })

    it('falls back to $.type for page calls and routes IPv6 correctly', async () => {
      let sentBody: Record<string, unknown> = {}
      nock(baseUrl)
        .post('/webevents/v1/track', (body) => {
          sentBody = body
          return true
        })
        .reply(200, { status: 'success' })

      const pageEvent = createTestEvent({
        type: 'page',
        event: undefined,
        anonymousId: 'anon-abc',
        userId: undefined,
        timestamp: '2026-09-10T20:00:00.000Z',
        context: { ip: '2001:db8::1', userAgent: 'UA' },
        properties: { url: 'https://shop.example.com/', title: 'Home' }
      })

      await testDestination.testAction('sendEvent', {
        event: pageEvent,
        settings,
        useDefaultMappings: true
      })

      expect(sentBody.event).toBe('page')
      expect(sentBody.ipv6).toBe('2001:db8::1')
      expect(sentBody.ipv4).toBeUndefined()
      expect(sentBody.url).toBe('https://shop.example.com/')
      expect(sentBody.user_id).toBeUndefined()
      expect(sentBody.hem_sha256).toBeUndefined()
    })

    it('passes a pre-hashed sha256 email through untouched', async () => {
      let sentBody: Record<string, unknown> = {}
      nock(baseUrl)
        .post('/webevents/v1/track', (body) => {
          sentBody = body
          return true
        })
        .reply(200, {})

      const digest = '31C5543C1734D25C7206F5FD591525D0295BEC6FE84FF82F946A34FE970A1E66'
      await testDestination.testAction('sendEvent', {
        event: createTestEvent({ ...trackEvent, context: { ...trackEvent.context, traits: { email: digest } } }),
        settings,
        useDefaultMappings: true
      })

      expect(sentBody.hem_sha256).toBe(digest.toLowerCase())
      expect(sentBody.hem_sha1).toBeUndefined()
      expect(sentBody.hem_md5).toBeUndefined()
    })

    it('hashes properties.email and does not forward it in args', async () => {
      let sentBody: Record<string, unknown> = {}
      nock(baseUrl)
        .post('/webevents/v1/track', (body) => {
          sentBody = body
          return true
        })
        .reply(200, {})

      await testDestination.testAction('sendEvent', {
        event: createTestEvent({
          ...trackEvent,
          context: { ...trackEvent.context, traits: {} },
          properties: { email: 'Example@Example.com ', plan: 'pro' }
        }),
        settings,
        useDefaultMappings: true
      })

      expect(sentBody.hem_sha256).toBe('31c5543c1734d25c7206f5fd591525d0295bec6fe84ff82f946a34fe970a1e66')
      expect(sentBody.args).toEqual({ plan: 'pro' })
      expect(JSON.stringify(sentBody)).not.toMatch(/example@example\.com/i)
    })

    it('rejects an unparseable IP before making a request', async () => {
      await expect(
        testDestination.testAction('sendEvent', {
          event: createTestEvent({ ...trackEvent, context: { ...trackEvent.context, ip: 'not-an-ip' } }),
          settings,
          useDefaultMappings: true
        })
      ).rejects.toThrowError(/not a valid IPv4 or IPv6/)
    })

    it('surfaces a 403 from API Gateway as a non-retryable error', async () => {
      nock(baseUrl).post('/webevents/v1/track').reply(403, { message: 'Forbidden' })

      await expect(
        testDestination.testAction('sendEvent', { event: trackEvent, settings, useDefaultMappings: true })
      ).rejects.toMatchObject({ response: { status: 403 } })
    })
  })

  describe('sendEvent.performBatch', () => {
    const events = [
      trackEvent,
      createTestEvent({ ...trackEvent, messageId: 'msg-456', event: 'Product Viewed', properties: {} }),
      createTestEvent({ ...trackEvent, messageId: 'msg-789', event: 'Cart Viewed', properties: {} })
    ]

    it('marks every event successful on 200', async () => {
      let sentBody: unknown[] = []
      nock(baseUrl)
        .post('/webevents/v1/batch', (body) => {
          sentBody = body
          return true
        })
        .reply(200, { accepted_count: 3, rejected_count: 0 })

      const responses = await testDestination.executeBatch('sendEvent', {
        events,
        settings,
        mapping
      })

      expect(Array.isArray(sentBody)).toBe(true)
      expect(sentBody).toHaveLength(3)
      expect(responses.map((r) => r.status)).toEqual([200, 200, 200])
    })

    it('maps errors_by_index on a 207 partial accept', async () => {
      nock(baseUrl)
        .post('/webevents/v1/batch')
        .reply(207, {
          accepted_count: 2,
          rejected_count: 1,
          errors_by_index: { '1': "INVALID_URL: 'url' must start with 'https://' or 'http://'" },
          message: 'batch partially accepted due to ACCEPT_ANY_VALID policy'
        })

      const responses = await testDestination.executeBatch('sendEvent', {
        events,
        settings,
        mapping
      })

      expect(responses.map((r) => r.status)).toEqual([200, 400, 200])
      expect(responses[1]).toMatchObject({
        errortype: 'BAD_REQUEST',
        errormessage: expect.stringMatching(/INVALID_URL/)
      })
    })

    it('reports only event, event_dt and distinct_id in MultiStatus sent', async () => {
      nock(baseUrl)
        .post('/webevents/v1/batch')
        .reply(207, { accepted_count: 2, rejected_count: 1, errors_by_index: { '1': 'INVALID_URL' } })

      const responses = await testDestination.executeBatch('sendEvent', { events, settings, mapping })

      expect(responses[0].sent).toEqual({
        event: 'Order Completed',
        event_dt: '2026-09-10T20:00:00.000Z',
        distinct_id: 'msg-123'
      })
      expect(responses[1].sent).toEqual({
        event: 'Product Viewed',
        event_dt: '2026-09-10T20:00:00.000Z',
        distinct_id: 'msg-456'
      })
      const serialized = JSON.stringify(responses)
      expect(serialized).not.toMatch(
        /user-42|anon-abc|203\.0\.113\.9|Mozilla|shop\.example\.com|hem_|example@example\.com/i
      )
    })

    it('on a REJECT_ALL_IF_ANY_INVALID 400, fails the bad event and marks valid siblings retryable', async () => {
      nock(baseUrl)
        .post('/webevents/v1/batch')
        .reply(400, {
          accepted_count: 0,
          rejected_count: 3,
          errors_by_index: { '0': 'EVENT_DT_TOO_FAR_IN_PAST: ...' },
          message: 'batch rejected due to REJECT_ALL_IF_ANY_INVALID policy'
        })

      const responses = await testDestination.executeBatch('sendEvent', {
        events,
        settings,
        mapping
      })

      expect(responses[0]).toMatchObject({ status: 400, errortype: 'BAD_REQUEST' })
      expect(responses[1]).toMatchObject({ status: 500, errortype: 'RETRYABLE_ERROR' })
      expect(responses[2]).toMatchObject({ status: 500, errortype: 'RETRYABLE_ERROR' })
    })

    it('fails every event on a batch-level 400 without errors_by_index', async () => {
      nock(baseUrl).post('/webevents/v1/batch').reply(400, { error: 'batch size 3 exceeds maximum of 1000' })

      const responses = await testDestination.executeBatch('sendEvent', {
        events,
        settings,
        mapping
      })

      expect(responses.map((r) => r.status)).toEqual([400, 400, 400])
      expect(responses[0]).toMatchObject({ errormessage: expect.stringMatching(/exceeds maximum/) })
    })

    it('keeps locally-invalid events out of the request and reports them per-index', async () => {
      let sentBody: unknown[] = []
      nock(baseUrl)
        .post('/webevents/v1/batch', (body) => {
          sentBody = body
          return true
        })
        .reply(200, { accepted_count: 2, rejected_count: 0 })

      const badIp = createTestEvent({ ...trackEvent, messageId: 'bad', context: { ...trackEvent.context, ip: 'nope' } })
      const responses = await testDestination.executeBatch('sendEvent', {
        events: [events[0], badIp, events[2]],
        settings,
        mapping
      })

      expect(sentBody).toHaveLength(2)
      expect(responses.map((r) => r.status)).toEqual([200, 400, 200])
      expect(responses[1]).toMatchObject({ errortype: 'PAYLOAD_VALIDATION_FAILED' })
    })

    it('maps API error indexes back to original positions after a locally-invalid event is dropped', async () => {
      nock(baseUrl)
        .post('/webevents/v1/batch')
        .reply(207, { accepted_count: 2, rejected_count: 1, errors_by_index: { '1': 'INVALID_URL' } })

      const badIp = createTestEvent({ ...trackEvent, messageId: 'bad', context: { ...trackEvent.context, ip: 'nope' } })
      const responses = await testDestination.executeBatch('sendEvent', {
        events: [events[0], badIp, events[1], events[2]],
        settings,
        mapping
      })

      expect(responses.map((r) => r.status)).toEqual([200, 400, 400, 200])
      expect(responses[1]).toMatchObject({ errortype: 'PAYLOAD_VALIDATION_FAILED' })
      expect(responses[2]).toMatchObject({ errortype: 'BAD_REQUEST', errormessage: 'INVALID_URL' })
    })

    it('caps batch_size and batch_bytes below the Tatari API limits', () => {
      expect(sendEvent.fields.batch_size).toMatchObject({ default: MAX_BATCH_SIZE, maximum: MAX_BATCH_SIZE })
      expect(sendEvent.fields.batch_bytes).toMatchObject({ default: MAX_BATCH_BYTES, unsafe_hidden: true })
      expect(MAX_BATCH_SIZE).toBe(1000)
      expect(MAX_BATCH_BYTES).toBeLessThan(3_000_000)
    })

    it('rejects a batch larger than MAX_BATCH_SIZE without making a request', async () => {
      const scope = nock(baseUrl).post('/webevents/v1/batch').reply(200, {})
      const oversized = Array.from({ length: MAX_BATCH_SIZE + 1 }, (_, i) =>
        createTestEvent({ ...trackEvent, messageId: `msg-${i}` })
      )

      await expect(
        testDestination.executeBatch('sendEvent', { events: oversized, settings, mapping })
      ).rejects.toThrowError(new RegExp(`at most ${MAX_BATCH_SIZE} events`))
      expect(scope.isDone()).toBe(false)
    })

    it('throws for the whole batch on 429 so the framework retries it', async () => {
      nock(baseUrl).post('/webevents/v1/batch').reply(429, { message: 'Too Many Requests' })

      await expect(testDestination.executeBatch('sendEvent', { events, settings, mapping })).rejects.toMatchObject({
        status: 429,
        message: expect.stringMatching(/Too Many Requests/)
      })
    })

    it('throws for the whole batch on 403 (bad API key)', async () => {
      nock(baseUrl).post('/webevents/v1/batch').reply(403, { message: 'Forbidden' })

      await expect(testDestination.executeBatch('sendEvent', { events, settings, mapping })).rejects.toMatchObject({
        status: 403
      })
    })
  })
})
