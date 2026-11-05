import crypto from 'crypto'
import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import type { Settings } from '../generated-types'

const testDestination = createTestIntegration(Destination)
const NOW = Date.parse('2026-11-03T12:00:00.000Z')
const timestamp = '2026-11-03T11:59:00.000Z'
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

const settings: Settings = { pixel_id: ' pix_123 ', api_key: ' key_abc ' }

const mapping = {
  event_type: 'order_created',
  event_id: { '@path': '$.messageId' },
  timestamp: { '@path': '$.timestamp' },
  action_source: 'web',
  source_url: { '@path': '$.context.page.url' },
  amount: { '@path': '$.properties.total' },
  currency: { '@path': '$.properties.currency' },
  essential_identifiers: { email: [{ '@path': '$.context.traits.email' }] },
  enable_batching: true
}

const makeEvent = (messageId: string, overrides: Record<string, unknown> = {}) =>
  createTestEvent({
    timestamp,
    messageId,
    type: 'track',
    event: 'Order Completed',
    context: { page: { url: 'https://example.com/thanks' }, traits: { email: 'Jane@Example.com' } },
    properties: { total: 25.99, currency: 'USD' },
    ...overrides
  })

beforeEach(() => {
  nock.cleanAll()
  jest.spyOn(Date, 'now').mockReturnValue(NOW)
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('ChatGPT Ads Conversions', () => {
  describe('sendConversion', () => {
    it('sends one event with the pixel ID, bearer key and integration source', async () => {
      let body: Record<string, unknown> = {}
      nock('https://bzr.openai.com', { reqheaders: { authorization: 'Bearer key_abc' } })
        .post('/v1/events', (requestBody) => {
          body = requestBody
          return true
        })
        .query({ pid: 'pix_123' })
        .reply(200, { accepted_events: 1 })

      const responses = await testDestination.testAction('sendConversion', {
        event: makeEvent('msg-1'),
        settings,
        mapping
      })

      expect(responses[0].status).toBe(200)
      expect(body).toEqual({
        integration_source: 'Segment',
        events: [
          {
            id: 'msg-1',
            type: 'order_created',
            timestamp_ms: Date.parse(timestamp),
            action_source: 'web',
            source_url: 'https://example.com/thanks',
            user: { emails_sha256: [sha256('jane@example.com')] },
            data: { type: 'contents', amount: 2599, currency: 'USD' }
          }
        ]
      })
    })

    it('sends validate_only when the setting is on', async () => {
      let body: Record<string, unknown> = {}
      nock('https://bzr.openai.com')
        .post('/v1/events', (requestBody) => {
          body = requestBody
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('sendConversion', {
        event: makeEvent('msg-1'),
        settings: { ...settings, validate_only: true },
        mapping
      })

      expect(body).toMatchObject({ validate_only: true })
    })

    it('throws a payload validation error for an invalid event instead of sending', async () => {
      const scope = nock('https://bzr.openai.com').post('/v1/events').query(true).reply(200, {})
      await expect(
        testDestination.testAction('sendConversion', {
          event: makeEvent('msg-1', { timestamp: '2026-10-01T00:00:00.000Z' }),
          settings,
          mapping
        })
      ).rejects.toThrow('more than 7 days old')
      expect(scope.isDone()).toBe(false)
    })

    it('rejects an event with no valid essential identifier', async () => {
      await expect(
        testDestination.testAction('sendConversion', {
          event: makeEvent('msg-1', { context: { page: { url: 'https://example.com' }, traits: {} } }),
          settings,
          mapping
        })
      ).rejects.toThrow('At least one valid essential identifier')
    })

    it('surfaces a 400 from ChatGPT Ads', async () => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(400, { error: 'bad request' })
      await expect(
        testDestination.testAction('sendConversion', { event: makeEvent('msg-1'), settings, mapping })
      ).rejects.toThrow()
    })
  })

  describe('field validation', () => {
    const rejectedBySchema = async (
      overrides: Record<string, unknown>,
      eventOverrides: Record<string, unknown> = {}
    ) => {
      const scope = nock('https://bzr.openai.com').post('/v1/events').query(true).reply(200, {})
      await expect(
        testDestination.testAction('sendConversion', {
          event: makeEvent('msg-1', eventOverrides),
          settings,
          mapping: { ...mapping, ...overrides }
        })
      ).rejects.toThrow()
      expect(scope.isDone()).toBe(false)
    }

    it('enforces the string length limits from the field schema', async () => {
      await rejectedBySchema({ event_type: 'custom', custom_event_name: 'a'.repeat(65) })
      await rejectedBySchema({ currency: 'USDD' })
      await rejectedBySchema({ currency: 'US' })
      await rejectedBySchema({ matching_data: { country: 'USA' } })
      await rejectedBySchema({ matching_data: { country: 'U' } })
      await rejectedBySchema({ matching_data: { postal_code: 'x'.repeat(33) } })
      await rejectedBySchema({ matching_data: { city: 'x'.repeat(129) } })
      await rejectedBySchema({ matching_data: { region: 'x'.repeat(129) } })
      await rejectedBySchema({ essential_identifiers: { android_advertising_id: 'too-short' } })
    })

    it('accepts strings at the length limits', async () => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(200, {})
      const responses = await testDestination.testAction('sendConversion', {
        event: makeEvent('msg-1'),
        settings,
        mapping: {
          ...mapping,
          matching_data: { country: 'US', postal_code: 'x'.repeat(32), city: 'x'.repeat(128), region: 'x'.repeat(128) }
        }
      })
      expect(responses[responses.length - 1].status).toBe(200)
    })

    it('requires custom_event_name for custom events, source_url for web events and currency with an amount', async () => {
      await rejectedBySchema({ event_type: 'custom' })
      await rejectedBySchema({}, { context: { traits: { email: 'jane@example.com' } } })
      await rejectedBySchema({}, { properties: { total: 5 } })
    })

    it('requires the essential identifiers group', async () => {
      const { essential_identifiers: _omitted, ...withoutGroup } = mapping
      await expect(
        testDestination.testAction('sendConversion', { event: makeEvent('msg-1'), settings, mapping: withoutGroup })
      ).rejects.toThrow()
    })
  })

  describe('presets', () => {
    const richEvent = (type: 'track' | 'page') =>
      createTestEvent({
        timestamp,
        messageId: 'msg-preset',
        type,
        anonymousId: 'anon_1',
        userId: 'user_1',
        context: {
          ip: '203.0.113.9',
          userAgent: 'Mozilla/5.0',
          page: { url: 'https://example.com/page' },
          device: { advertisingId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
          traits: {
            email: 'jane@example.com',
            first_name: 'Jane',
            last_name: 'Doe',
            address: { city: 'Austin', state: 'Texas', country: 'US', postalCode: '78701' }
          }
        },
        integrations: { 'ChatGPT Ads Conversions': { oppref: 'opp_1' } },
        properties: {
          product_id: 'sku_1',
          category_id: 'cat_1',
          name: 'Shirt',
          price: 50.02,
          quantity: 2,
          total: 100.05,
          value: 100.05,
          currency: 'USD',
          plan_id: 'pro',
          products: [{ product_id: 'sku_1', category_id: 'cat_1', name: 'Shirt', price: 50.02, quantity: 2 }]
        }
      })

    it('has a preset for every event type except custom', () => {
      const eventTypes = (Destination.presets ?? []).map(
        (preset) => (preset as { mapping: { event_type: string } }).mapping.event_type
      )
      expect(eventTypes.sort()).toEqual(
        [
          'app_installed',
          'app_opened',
          'appointment_scheduled',
          'checkout_started',
          'contents_viewed',
          'items_added',
          'lead_created',
          'order_created',
          'page_viewed',
          'registration_completed',
          'subscription_created',
          'trial_started'
        ].sort()
      )
    })

    it.each((Destination.presets ?? []).map((preset) => [preset.name, preset] as const))(
      '%s maps a typical event to valid JSON',
      async (_name, preset) => {
        let body: { events: Record<string, any>[] } = { events: [] }
        nock('https://bzr.openai.com')
          .post('/v1/events', (requestBody) => {
            body = requestBody
            return true
          })
          .query(true)
          .reply(200, {})

        const { event_type, action_source: presetActionSource } = (preset as { mapping: Record<string, string> })
          .mapping
        const action_source = typeof presetActionSource === 'string' ? presetActionSource : 'web'
        const type = event_type === 'page_viewed' ? 'page' : 'track'

        const responses = await testDestination.testAction('sendConversion', {
          event: richEvent(type),
          settings,
          mapping: (preset as { mapping: Record<string, unknown> }).mapping
        })

        const [sent] = body.events
        expect(responses[0].status).toBe(200)
        expect(sent).toMatchObject({
          id: 'msg-preset',
          type: event_type,
          action_source,
          oppref: 'opp_1'
        })
        expect(sent.user).toMatchObject({
          emails_sha256: [sha256('jane@example.com')],
          external_ids_sha256: [sha256('user_1')],
          obref: 'anon_1',
          user_agent: 'Mozilla/5.0',
          ip_address: '203.0.113.9',
          first_names_sha256: [sha256('jane')],
          last_names_sha256: [sha256('doe')],
          cities: ['Austin'],
          regions: ['Texas'],
          countries: ['US'],
          postal_codes: ['78701']
        })
        expect(action_source !== 'mobile_app' || Boolean(sent.user.android_advertising_id)).toBe(true)
        expect(action_source !== 'web' || Boolean(sent.source_url)).toBe(true)
      }
    )

    it.each([
      ['Order Created', 'order_created', 10005],
      ['Checkout Started', 'checkout_started', 10005]
    ])('%s sends minor-unit amounts and per-unit contents from the products array', async (name, eventType, amount) => {
      let body: { events: Record<string, any>[] } = { events: [] }
      nock('https://bzr.openai.com')
        .post('/v1/events', (requestBody) => {
          body = requestBody
          return true
        })
        .query(true)
        .reply(200, {})

      const preset = (Destination.presets ?? []).find((candidate) => candidate.name === name)
      await testDestination.testAction('sendConversion', {
        event: richEvent('track'),
        settings,
        mapping: (preset as { mapping: Record<string, unknown> }).mapping
      })

      expect(body.events[0]).toMatchObject({ type: eventType })
      expect(body.events[0].data).toEqual({
        type: 'contents',
        amount,
        currency: 'USD',
        contents: [
          {
            id: 'sku_1',
            group_id: 'cat_1',
            name: 'Shirt',
            content_type: 'product',
            quantity: 2,
            amount: 5002,
            currency: 'USD'
          }
        ]
      })
    })

    it.each(['Contents Viewed', 'Items Added'])(
      '%s maps flat product properties into one content item',
      async (name) => {
        let body: { events: Record<string, any>[] } = { events: [] }
        nock('https://bzr.openai.com')
          .post('/v1/events', (requestBody) => {
            body = requestBody
            return true
          })
          .query(true)
          .reply(200, {})

        const preset = (Destination.presets ?? []).find((candidate) => candidate.name === name)
        await testDestination.testAction('sendConversion', {
          event: richEvent('track'),
          settings,
          mapping: (preset as { mapping: Record<string, unknown> }).mapping
        })

        expect(body.events[0].data.contents).toEqual([
          {
            id: 'sku_1',
            group_id: 'cat_1',
            name: 'Shirt',
            content_type: 'product',
            quantity: 2,
            amount: 5002,
            currency: 'USD'
          }
        ])
      }
    )
  })

  describe('sendConversion batch', () => {
    it('drops invalid events with a per-event error and sends the valid ones in one request', async () => {
      let body: { events: { id: string }[] } = { events: [] }
      nock('https://bzr.openai.com')
        .post('/v1/events', (requestBody) => {
          body = requestBody
          return true
        })
        .query({ pid: 'pix_123' })
        .reply(200, { accepted_events: 2 })

      const events = [
        makeEvent('msg-1'),
        makeEvent('msg-2', { timestamp: '2026-10-01T00:00:00.000Z' }),
        makeEvent('msg-3')
      ]

      const results = await testDestination.executeBatch('sendConversion', { events, settings, mapping })

      expect(body.events.map(({ id }) => id)).toEqual(['msg-1', 'msg-3'])
      expect(results[0]).toMatchObject({ status: 200, body: { accepted_events: 2 } })
      expect(results[0]).toHaveProperty('sent.id', 'msg-1')
      expect(results[1]).toMatchObject({ status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' })
      expect(results[1]).not.toHaveProperty('sent')
      expect(results[2]).toMatchObject({ status: 200 })
      expect(results[2]).toHaveProperty('sent.id', 'msg-3')
    })

    it('does not call the API when every event is invalid', async () => {
      const scope = nock('https://bzr.openai.com').post('/v1/events').query(true).reply(200, {})
      const events = [makeEvent('msg-1', { timestamp: '2026-10-01T00:00:00.000Z' })]

      const results = await testDestination.executeBatch('sendConversion', { events, settings, mapping })

      expect(results[0]).toMatchObject({ status: 400 })
      expect(scope.isDone()).toBe(false)
    })

    it('marks every valid event with the API status when ChatGPT Ads rejects the batch', async () => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(400, { error: 'invalid user list' })

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1'), makeEvent('msg-2')],
        settings,
        mapping
      })

      results.forEach((result, index) => {
        expect(result).toMatchObject({ status: 400, body: { error: 'invalid user list' } })
        expect(result).toHaveProperty('sent.id', `msg-${index + 1}`)
      })
    })

    it('reports 5xx responses per event so they can be retried', async () => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(503, {})

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1')],
        settings,
        mapping
      })

      expect(results[0]).toMatchObject({ status: 503 })
    })

    it('treats a 200 with an empty body as success', async () => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(200)

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1')],
        settings,
        mapping
      })

      expect(results[0]).toMatchObject({ status: 200 })
      expect(results[0]).toHaveProperty('sent.id', 'msg-1')
    })

    it.each([401, 429])('marks every valid event with status %s and a non-empty error message', async (status) => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(status, { error: 'nope' })

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1'), makeEvent('msg-2')],
        settings,
        mapping
      })

      results.forEach((result) => {
        expect(result).toMatchObject({ status, body: { error: 'nope' } })
        expect((result as { errormessage: string }).errormessage.length).toBeGreaterThan(0)
      })
    })

    it('returns a plain text error body as a string', async () => {
      nock('https://bzr.openai.com')
        .post('/v1/events')
        .query(true)
        .reply(400, 'bad request', { 'content-type': 'text/plain' })

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1')],
        settings,
        mapping
      })

      expect(results[0]).toMatchObject({ status: 400, body: 'bad request' })
    })
  })

  describe('sendConversion batch multistatus response', () => {
    const staleTimestamp = '2026-10-01T00:00:00.000Z'
    const noIdentifiers = { context: { page: { url: 'https://example.com/thanks' } } }

    const sentEvent = (id: string) => ({
      id,
      type: 'order_created',
      timestamp_ms: Date.parse(timestamp),
      action_source: 'web',
      source_url: 'https://example.com/thanks',
      user: { emails_sha256: [sha256('jane@example.com')] },
      data: { type: 'contents', amount: 2599, currency: 'USD' }
    })

    const invalidTimestamp = {
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errorreporter: 'INTEGRATIONS',
      errormessage: 'Timestamp is more than 7 days old, which ChatGPT Ads rejects.'
    }

    const invalidIdentifiers = {
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errorreporter: 'INTEGRATIONS',
      errormessage: expect.stringContaining('At least one valid essential identifier')
    }

    const invalidEventBody = (position: number, field: string, code: string, message: string) => ({
      error: {
        message: `Invalid event at events[${position}]. See errors for details.`,
        type: 'invalid_request_error',
        param: `events[${position}]`,
        code: 'invalid_event',
        errors: [{ message: `events[${position}].${field} ${message}`, param: `events[${position}].${field}`, code }]
      }
    })

    const rejectedEvent = (id: string, status: number, errortype: string, errormessage: string, body: object) => ({
      status,
      errormessage,
      errorreporter: 'DESTINATION',
      errortype,
      sent: sentEvent(id),
      body
    })

    const retriedEvent = (id: string, reason: string, body: object) => ({
      status: 500,
      errormessage: `Not delivered because another event in the batch was rejected by ChatGPT Ads (${reason}). It will be retried.`,
      errorreporter: 'DESTINATION',
      errortype: 'INTERNAL_SERVER_ERROR',
      sent: sentEvent(id),
      body
    })

    const sixEvents = () => ['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6'].map((id) => makeEvent(id))

    it('mixes pre-send validation failures with successes', async () => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(200, { accepted_events: 2 })

      const results = await testDestination.executeBatch('sendConversion', {
        events: [
          makeEvent('msg-1'),
          makeEvent('msg-2', { timestamp: staleTimestamp }),
          makeEvent('msg-3'),
          makeEvent('msg-4', noIdentifiers)
        ],
        settings,
        mapping
      })

      expect(results).toEqual([
        { status: 200, sent: sentEvent('msg-1'), body: { accepted_events: 2 } },
        invalidTimestamp,
        { status: 200, sent: sentEvent('msg-3'), body: { accepted_events: 2 } },
        invalidIdentifiers
      ])
    })

    it('mixes pre-send validation failures with events the API rejected', async () => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(400, { error: 'invalid user list' })

      const results = await testDestination.executeBatch('sendConversion', {
        events: [
          makeEvent('msg-1'),
          makeEvent('msg-2', { timestamp: staleTimestamp }),
          makeEvent('msg-3'),
          makeEvent('msg-4', noIdentifiers)
        ],
        settings,
        mapping
      })

      expect(results).toEqual([
        {
          status: 400,
          errormessage: 'Bad Request',
          errorreporter: 'DESTINATION',
          errortype: 'BAD_REQUEST',
          sent: sentEvent('msg-1'),
          body: { error: 'invalid user list' }
        },
        invalidTimestamp,
        {
          status: 400,
          errormessage: 'Bad Request',
          errorreporter: 'DESTINATION',
          errortype: 'BAD_REQUEST',
          sent: sentEvent('msg-3'),
          body: { error: 'invalid user list' }
        },
        invalidIdentifiers
      ])
    })

    it('fails only the event the API names and retries the other valid events', async () => {
      const apiBody = {
        error: {
          message: 'Invalid event at events[1]. See errors for details.',
          type: 'invalid_request_error',
          param: 'events[1]',
          code: 'invalid_event',
          errors: [
            {
              message: 'events[1].type must be a supported event type.',
              param: 'events[1].type',
              code: 'unknown_event_type'
            }
          ]
        }
      }
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(400, apiBody)

      const results = await testDestination.executeBatch('sendConversion', {
        events: [
          makeEvent('msg-1', { timestamp: staleTimestamp }),
          makeEvent('msg-2'),
          makeEvent('msg-3'),
          makeEvent('msg-4')
        ],
        settings,
        mapping
      })

      const retried = (id: string) => ({
        status: 500,
        errormessage:
          'Not delivered because another event in the batch was rejected by ChatGPT Ads (type must be a supported event type.). It will be retried.',
        errorreporter: 'DESTINATION',
        errortype: 'INTERNAL_SERVER_ERROR',
        sent: sentEvent(id),
        body: apiBody
      })

      expect(results).toEqual([
        invalidTimestamp,
        retried('msg-2'),
        {
          status: 400,
          errormessage: 'type must be a supported event type.',
          errorreporter: 'DESTINATION',
          errortype: 'BAD_REQUEST',
          sent: sentEvent('msg-3'),
          body: apiBody
        },
        retried('msg-4')
      ])
    })

    it('fails only the event named in a 422 timestamp rejection', async () => {
      const apiBody = {
        error: {
          message: 'event_timestamp_ms must be within the last 7 days.',
          type: 'invalid_request_error',
          param: 'events[0].timestamp_ms',
          code: 'event_timestamp_too_old',
          errors: [
            {
              message: 'event_timestamp_ms must be within the last 7 days.',
              param: 'events[0].timestamp_ms',
              code: 'event_timestamp_too_old'
            }
          ]
        }
      }
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(422, apiBody)

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1'), makeEvent('msg-2')],
        settings,
        mapping
      })

      expect(results).toEqual([
        {
          status: 422,
          errormessage: 'event_timestamp_ms must be within the last 7 days.',
          errorreporter: 'DESTINATION',
          errortype: 'UNPROCESSABLE_ENTITY',
          sent: sentEvent('msg-1'),
          body: apiBody
        },
        {
          status: 500,
          errormessage:
            'Not delivered because another event in the batch was rejected by ChatGPT Ads (event_timestamp_ms must be within the last 7 days.). It will be retried.',
          errorreporter: 'DESTINATION',
          errortype: 'INTERNAL_SERVER_ERROR',
          sent: sentEvent('msg-2'),
          body: apiBody
        }
      ])
    })

    it('fails every valid event with the same status when the rejection is not about one event', async () => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(403, '403: unknown pid', {
        'content-type': 'text/plain'
      })

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1'), makeEvent('msg-2')],
        settings,
        mapping
      })

      const failed = (id: string) => ({
        status: 403,
        errormessage: expect.any(String),
        errorreporter: 'DESTINATION',
        errortype: 'FORBIDDEN',
        sent: sentEvent(id),
        body: '403: unknown pid'
      })
      expect(results).toEqual([failed('msg-1'), failed('msg-2')])
    })

    it('fails the event named at events[0] and retries the rest', async () => {
      const apiBody = invalidEventBody(0, 'type', 'unknown_event_type', 'must be a supported event type.')
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(400, apiBody)

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1'), makeEvent('msg-2'), makeEvent('msg-3')],
        settings,
        mapping
      })

      const reason = 'type must be a supported event type.'
      expect(results).toEqual([
        rejectedEvent('msg-1', 400, 'BAD_REQUEST', reason, apiBody),
        retriedEvent('msg-2', reason, apiBody),
        retriedEvent('msg-3', reason, apiBody)
      ])
    })

    it('fails the event named at events[5] and retries the other five, even though only one error is reported', async () => {
      const apiBody = invalidEventBody(5, 'type', 'unknown_event_type', 'must be a supported event type.')
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(400, apiBody)

      const results = await testDestination.executeBatch('sendConversion', {
        events: sixEvents(),
        settings,
        mapping
      })

      const reason = 'type must be a supported event type.'
      expect(results).toEqual([
        retriedEvent('msg-1', reason, apiBody),
        retriedEvent('msg-2', reason, apiBody),
        retriedEvent('msg-3', reason, apiBody),
        retriedEvent('msg-4', reason, apiBody),
        retriedEvent('msg-5', reason, apiBody),
        rejectedEvent('msg-6', 400, 'BAD_REQUEST', reason, apiBody)
      ])
    })

    it('fails the event named at events[5].data.amount and retries the others when an earlier event is also bad', async () => {
      const apiBody = invalidEventBody(5, 'data.amount', 'invalid_amount', 'must be an integer.')
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(400, apiBody)

      const results = await testDestination.executeBatch('sendConversion', {
        events: sixEvents(),
        settings,
        mapping
      })

      const reason = 'data.amount must be an integer.'
      expect(results).toEqual([
        retriedEvent('msg-1', reason, apiBody),
        retriedEvent('msg-2', reason, apiBody),
        retriedEvent('msg-3', reason, apiBody),
        retriedEvent('msg-4', reason, apiBody),
        retriedEvent('msg-5', reason, apiBody),
        rejectedEvent('msg-6', 400, 'BAD_REQUEST', reason, apiBody)
      ])
    })

    it('maps the position the API names to the right payload when earlier events failed pre-send', async () => {
      const apiBody = invalidEventBody(1, 'type', 'unknown_event_type', 'must be a supported event type.')
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(400, apiBody)

      const results = await testDestination.executeBatch('sendConversion', {
        events: [
          makeEvent('msg-1'),
          makeEvent('msg-2', { timestamp: staleTimestamp }),
          makeEvent('msg-3', noIdentifiers),
          makeEvent('msg-4'),
          makeEvent('msg-5')
        ],
        settings,
        mapping
      })

      const reason = 'type must be a supported event type.'
      expect(results).toEqual([
        retriedEvent('msg-1', reason, apiBody),
        invalidTimestamp,
        invalidIdentifiers,
        rejectedEvent('msg-4', 400, 'BAD_REQUEST', reason, apiBody),
        retriedEvent('msg-5', reason, apiBody)
      ])
    })

    it('fails every valid event with the same error when the API rejects the whole request', async () => {
      const apiBody = {
        error: {
          message: 'Invalid request body. See errors for details.',
          type: 'invalid_request_error',
          param: null,
          code: 'invalid_request_body',
          errors: [{ message: 'Missing required field: events.', param: 'events', code: 'missing_events' }]
        }
      }
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(400, apiBody)

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1'), makeEvent('msg-2')],
        settings,
        mapping
      })

      expect(results).toEqual([
        rejectedEvent('msg-1', 400, 'BAD_REQUEST', 'Missing required field: events.', apiBody),
        rejectedEvent('msg-2', 400, 'BAD_REQUEST', 'Missing required field: events.', apiBody)
      ])
    })

    it('fails every valid event with the same error when the API names an event outside the batch', async () => {
      const apiBody = invalidEventBody(9, 'type', 'unknown_event_type', 'must be a supported event type.')
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(400, apiBody)

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1'), makeEvent('msg-2')],
        settings,
        mapping
      })

      const reason = 'type must be a supported event type.'
      expect(results).toEqual([
        rejectedEvent('msg-1', 400, 'BAD_REQUEST', reason, apiBody),
        rejectedEvent('msg-2', 400, 'BAD_REQUEST', reason, apiBody)
      ])
    })

    it.each([
      [
        401,
        'UNAUTHORIZED',
        { error: { message: 'unknown error', type: 'invalid_request_error', param: null, code: null } }
      ],
      [403, 'FORBIDDEN', { error: { message: '403: unknown pid', type: 'server_error', param: null, code: null } }]
    ])(
      'fails every valid event with the API message for a %s auth error with no errors array',
      async (status: number, errortype: string, apiBody: { error: { message: string } }) => {
        nock('https://bzr.openai.com').post('/v1/events').query(true).reply(status, apiBody)

        const results = await testDestination.executeBatch('sendConversion', {
          events: [makeEvent('msg-1'), makeEvent('msg-2')],
          settings,
          mapping
        })

        expect(results).toEqual([
          rejectedEvent('msg-1', status, errortype, apiBody.error.message, apiBody),
          rejectedEvent('msg-2', status, errortype, apiBody.error.message, apiBody)
        ])
      }
    )

    it('does not treat an event index in a 5xx body as a rejected event', async () => {
      const apiBody = invalidEventBody(1, 'type', 'unknown_event_type', 'must be a supported event type.')
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(503, apiBody)

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1'), makeEvent('msg-2')],
        settings,
        mapping
      })

      const reason = 'type must be a supported event type.'
      const unavailable = (id: string) => ({
        ...rejectedEvent(id, 503, 'SERVICE_UNAVAILABLE', reason, apiBody)
      })
      expect(results).toEqual([unavailable('msg-1'), unavailable('msg-2')])
    })

    it('mixes pre-send validation failures with a retryable API failure', async () => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(503, { error: 'unavailable' })

      const results = await testDestination.executeBatch('sendConversion', {
        events: [makeEvent('msg-1'), makeEvent('msg-2', { timestamp: staleTimestamp }), makeEvent('msg-3')],
        settings,
        mapping
      })

      expect(results).toEqual([
        {
          status: 503,
          errormessage: 'Service Unavailable',
          errorreporter: 'DESTINATION',
          errortype: 'SERVICE_UNAVAILABLE',
          sent: sentEvent('msg-1'),
          body: { error: 'unavailable' }
        },
        invalidTimestamp,
        {
          status: 503,
          errormessage: 'Service Unavailable',
          errorreporter: 'DESTINATION',
          errortype: 'SERVICE_UNAVAILABLE',
          sent: sentEvent('msg-3'),
          body: { error: 'unavailable' }
        }
      ])
    })
  })

  describe('action_source default', () => {
    const { action_source: _omit, source_url: _omitUrl, ...mappingWithoutSource } = mapping

    const send = async (event: ReturnType<typeof makeEvent>) => {
      let body: { events: Record<string, any>[] } = { events: [] }
      nock('https://bzr.openai.com')
        .post('/v1/events', (requestBody) => {
          body = requestBody
          return true
        })
        .query(true)
        .reply(200, {})
      await testDestination.testAction('sendConversion', {
        event,
        settings,
        mapping: mappingWithoutSource,
        useDefaultMappings: true
      })
      return body.events[0]
    }

    it('defaults to web with the page URL when the event has a page URL', async () => {
      const sent = await send(makeEvent('msg-1'))
      expect(sent).toMatchObject({ action_source: 'web', source_url: 'https://example.com/thanks' })
    })

    it('defaults to other without a source URL when the event has no page URL', async () => {
      const sent = await send(makeEvent('msg-2', { context: { traits: { email: 'Jane@Example.com' } } }))
      expect(sent.action_source).toBe('other')
      expect(sent).not.toHaveProperty('source_url')
    })
  })

  describe('sendConversion single event errors', () => {
    it.each([401, 429, 500])('throws when ChatGPT Ads responds with %s', async (status) => {
      nock('https://bzr.openai.com').post('/v1/events').query(true).reply(status, { error: 'nope' })

      await expect(
        testDestination.testAction('sendConversion', { event: makeEvent('msg-1'), settings, mapping })
      ).rejects.toThrow()
    })
  })
})
