// Test raw customer IDs independently of the repository's hash auto-detection.
// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'
import nock from 'nock'
import { createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import type { JSONObject } from '@segment/actions-core'
import Definition from '../index'
import { formatEvent, minorAmount } from '../reportWebEvent/format'
import type { Payload } from '../reportWebEvent/generated-types'

const settings = { pixel_id: 'test-pixel', api_key: 'fake-test-key' }
const time = '2026-10-20T00:00:00.000Z'
const base = {
  event_type: 'order_created',
  event_id: 'purchase-42',
  timestamp: time,
  source_url: 'https://example.com/thank-you'
}
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const api = (status = 200, body: object = { accepted_events: 1 }) =>
  nock('https://bzr.openai.com', { reqheaders: { authorization: 'Bearer fake-test-key' } })
    .post('/v1/events')
    .query({ pid: 'test-pixel' })
    .reply(status, body)

const run = (mapping: JSONObject = {}) =>
  createTestIntegration(Definition).testAction('reportWebEvent', {
    settings,
    mapping: { ...base, ...mapping }
  })

describe('ChatGPT Ads Conversions', () => {
  it('maps a Segment purchase, hashes identity, and converts USD values to cents', async () => {
    const scope = api()
    const responses = await createTestIntegration(Definition).testAction('reportWebEvent', {
      settings,
      event: {
        type: 'track',
        event: 'Order Completed',
        messageId: 'segment-42',
        timestamp: time,
        userId: 'customer-42',
        context: { page: { url: base.source_url }, traits: { email: '  TEST@EXAMPLE.COM  ' } },
        properties: { revenue: 19.99, currency: 'usd', products: [{ product_id: 'sku-42', price: 19.99, quantity: 1 }] }
      },
      mapping: { event_type: 'order_created' },
      useDefaultMappings: true
    })
    expect(scope.isDone()).toBe(true)
    const payload = responses[0].options.json
    expect(JSON.parse(JSON.stringify(payload))).toEqual({
      integration_source: 'segment',
      validate_only: false,
      events: [
        {
          id: 'segment-42',
          type: 'order_created',
          timestamp_ms: 1792454400000,
          action_source: 'web',
          source_url: base.source_url,
          user: { email_sha256: digest('test@example.com'), external_id_sha256: digest('customer-42') },
          data: {
            type: 'contents',
            amount: 1999,
            currency: 'USD',
            contents: [{ id: 'sku-42', amount: 1999, currency: 'USD', quantity: 1 }]
          }
        }
      ]
    })
    expect(JSON.stringify(payload)).not.toContain('TEST@EXAMPLE.COM')
    expect(JSON.stringify(payload)).not.toContain('customer-42')
  })

  it.each([
    ['appointment_scheduled', 'customer_action'],
    ['checkout_started', 'contents'],
    ['contents_viewed', 'contents'],
    ['items_added', 'contents'],
    ['lead_created', 'customer_action'],
    ['order_created', 'contents'],
    ['page_viewed', 'contents'],
    ['registration_completed', 'customer_action'],
    ['subscription_created', 'plan_enrollment'],
    ['trial_started', 'plan_enrollment']
  ])('sends %s with the correct data type', async (event_type, dataType) => {
    const scope = api()
    const [response] = await run({ event_type })
    expect((response.options.json as any).events[0].data.type).toBe(dataType)
    expect(scope.isDone()).toBe(true)
  })

  it('maps an explicit event ID before the Segment message ID', async () => {
    api()
    const [response] = await createTestIntegration(Definition).testAction('reportWebEvent', {
      settings,
      useDefaultMappings: true,
      mapping: { event_type: 'order_created' },
      event: {
        timestamp: time,
        messageId: 'transport-id',
        properties: { event_id: 'shared-id' },
        context: { page: { url: base.source_url } }
      }
    })
    expect((response.options.json as any).events[0].id).toBe('shared-id')
  })

  it.each([true, false, null])('preserves explicit opt_out=%s', async (opt_out) => {
    api()
    const [response] = await run({ opt_out })
    expect((response.options.json as any).events[0].opt_out).toBe(opt_out)
  })

  it('does not invent consent or matching data when absent', async () => {
    api()
    const [response] = await run()
    const event = JSON.parse(JSON.stringify(response.options.json)).events[0]
    expect(event).not.toHaveProperty('opt_out')
    expect(event).not.toHaveProperty('user')
  })

  it('forwards supported matching fields and opaque references without double hashing', async () => {
    const user_data = {
      email_sha256: digest('one@example.com'),
      emails_sha256: [digest('two@example.com')],
      external_id_sha256: digest('42'),
      external_ids_sha256: [digest('43')],
      phone_numbers_sha256: [digest('14155550100')],
      first_names_sha256: [digest('test')],
      last_names_sha256: [digest('user')],
      country: 'us',
      countries: ['us'],
      city: 'new york',
      cities: ['new york'],
      regions: ['ny'],
      postal_codes: ['10001'],
      ip_address: '192.0.2.1',
      user_agent: 'Test browser',
      obref: 'opaque+browser=='
    }
    api()
    const [response] = await run({ user_data, oppref: 'opaque+click==' })
    const event = (response.options.json as any).events[0]
    expect(event.user).toEqual(user_data)
    expect(event.oppref).toBe('opaque+click==')
  })

  it('trims customer ID whitespace while preserving case and internal spaces', async () => {
    const scope = api()
    const [response] = await run({ external_id: ' \tCustomer 42\r\n' })
    expect((response.options.json as any).events[0].user).toEqual({
      external_id_sha256: digest('Customer 42')
    })
    expect(scope.isDone()).toBe(true)
  })

  it('sends custom names and explicitly mapped custom properties', async () => {
    api()
    const [response] = await run({
      event_type: 'custom',
      custom_event_name: 'Quote_Requested',
      custom_properties: { quote_type: 'home', approved: false },
      amount: 0,
      currency: 'USD',
      plan_id: 'plan-1'
    })
    expect((response.options.json as any).events[0]).toMatchObject({
      type: 'custom',
      custom_event_name: 'quote_requested',
      data: { type: 'custom', quote_type: 'home', approved: false, amount: 0, currency: 'USD', plan_id: 'plan-1' }
    })
  })

  it('checks credentials without publishing an event', async () => {
    const scope = nock('https://bzr.openai.com')
      .post(
        '/v1/events',
        (body) => body.validate_only === true && body.events.length === 1 && body.integration_source === 'segment'
      )
      .query({ pid: 'test-pixel' })
      .reply(200, { accepted_events: 1 })
    await createTestIntegration(Definition).testAuthentication(settings)
    expect(scope.isDone()).toBe(true)
  })

  it.each([400, 401, 403, 408, 429, 500, 502, 503, 504])(
    'surfaces HTTP %s for Segment to handle',
    async (status: number) => {
      api(status, { error: { message: 'private customer response' } })
      const error = await run().catch((value: Error & { status: number }) => value)
      expect(error).toMatchObject({ status: [401, 403].includes(status) ? 401 : status })
      expect(String(error)).not.toContain('private customer response')
    }
  )

  it.each([{}, { accepted_events: 0 }, { accepted_events: 2 }])(
    'rejects unconfirmed success %j',
    async (response: object) => {
      api(200, response)
      await expect(run()).rejects.toMatchObject({ status: 500 })
    }
  )

  it('keeps the same ID, time and payload after a transient failure', async () => {
    const bodies: unknown[] = []
    const scope = nock('https://bzr.openai.com')
      .post('/v1/events', (body) => {
        bodies.push(body)
        return true
      })
      .query({ pid: 'test-pixel' })
      .reply(503, {})
      .post('/v1/events', (body) => {
        bodies.push(body)
        return true
      })
      .query({ pid: 'test-pixel' })
      .reply(200, { accepted_events: 1 })
    await expect(run()).rejects.toMatchObject({ status: 503 })
    await run()
    expect(bodies[0]).toEqual(bodies[1])
    expect((bodies[1] as any).events[0]).toMatchObject({ id: 'purchase-42', timestamp_ms: 1792454400000 })
    expect(scope.isDone()).toBe(true)
  })

  it('does not follow redirects with credentials or customer data', async () => {
    const target = nock('https://example.org').post('/collect').reply(200, { accepted_events: 1 })
    nock('https://bzr.openai.com')
      .post('/v1/events')
      .query(true)
      .reply(307, '', { Location: 'https://example.org/collect' })
    await expect(run()).rejects.toMatchObject({ status: 307 })
    expect(target.isDone()).toBe(false)
  })

  it('surfaces a network failure', async () => {
    nock('https://bzr.openai.com')
      .post('/v1/events')
      .query(true)
      .replyWithError({ code: 'ECONNRESET', message: 'connection reset' })
    await expect(run()).rejects.toThrow()
  })

  it.each<JSONObject>([
    { event_id: '' },
    { timestamp: 'not a time' },
    { source_url: 'no-host' },
    { event_type: 'app_opened' },
    { event_type: 'unknown' },
    { amount: 1 },
    { amount: 1.001, currency: 'USD' },
    { amount: 1.5, currency: 'USD', amount_units: 'minor' },
    { currency: 'dollars' },
    { event_type: 'custom' },
    { event_type: 'custom', custom_event_name: 'Order Created' },
    { event_type: 'custom', custom_event_name: 'ORDER_CREATED' },
    { event_type: 'custom', custom_event_name: '_bad' },
    { event_type: 'custom', custom_event_name: 'x'.repeat(65) },
    { plan_id: 'wrong-event' },
    { custom_properties: { x: 1 } },
    { event_type: 'custom', custom_event_name: 'test', custom_properties: { type: 'contents' } },
    { email: 'not-an-email' },
    { external_id: ' \t\n' },
    { email: 'a@example.com', user_data: { email_sha256: digest('a@example.com') } },
    { user_data: { email_sha256: 'raw@example.com' } },
    { user_data: { ip_address: 'invalid' } },
    { user_data: { emails_sha256: [digest('1'), digest('2'), digest('3'), digest('4')] } },
    { user_data: { email_sha256: digest('0'), emails_sha256: [digest('1'), digest('2'), digest('3')] } },
    { event_type: 'lead_created', contents: [{ id: 'product' }] }
  ])('rejects invalid mapped data before sending: %j', async (mapping: JSONObject) => {
    const scope = api()
    await expect(run(mapping)).rejects.toThrow()
    expect(scope.isDone()).toBe(false)
  })

  it.each(['', 'bad/pixel', 'with space'])('rejects invalid Pixel ID %s', async (pixel_id) => {
    await expect(createTestIntegration(Definition).testAuthentication({ ...settings, pixel_id })).rejects.toThrow()
  })

  it.each(Definition.presets ?? [])('runs preset $name through Segment mappings', async (preset) => {
    const scope = api()
    await createTestIntegration(Definition).testAction('reportWebEvent', {
      settings,
      mapping: preset.mapping,
      event: {
        type: preset.name === 'Page Viewed' ? 'page' : 'track',
        event: preset.name,
        messageId: 'preset-id',
        timestamp: time,
        context: { page: { url: base.source_url } },
        properties: { currency: 'USD' }
      }
    })
    expect(scope.isDone()).toBe(true)
  })
})

describe('amount conversion and event validation', () => {
  it('reuses currency precision across items and events without mixing currencies', () => {
    jest.isolateModules(() => {
      const { formatEvent: formatIsolatedEvent } =
        jest.requireActual<typeof import('../reportWebEvent/format')>('../reportWebEvent/format')
      const numberFormat = jest.spyOn(Intl, 'NumberFormat')
      try {
        const payload = {
          ...base,
          amount: 19.99,
          currency: 'USD',
          contents: [
            { amount: 2.5, currency: ' usd ' },
            { amount: 100, currency: 'JPY' },
            { amount: 200, currency: 'JPY' },
            { amount: 1.234, currency: 'KWD' }
          ]
        }
        const event = formatIsolatedEvent(payload)
        expect(event.data).toMatchObject({
          amount: 1999,
          currency: 'USD',
          contents: [
            { amount: 250, currency: 'USD' },
            { amount: 100, currency: 'JPY' },
            { amount: 200, currency: 'JPY' },
            { amount: 1234, currency: 'KWD' }
          ]
        })
        expect(formatIsolatedEvent(payload)).toEqual(event)
        expect(numberFormat).toHaveBeenCalledTimes(3)
      } finally {
        numberFormat.mockRestore()
      }
    })
  })

  it.each<[number, string, number]>([
    [19.99, 'USD', 1999],
    [1.005, 'KWD', 1005],
    [1200, 'JPY', 1200],
    [0, 'USD', 0],
    [1e-3, 'KWD', 1],
    [-2.5, 'USD', -250],
    [0.0001, 'CLF', 1]
  ])('converts %s %s to %s minor units', (value: number, currency: string, expected: number) => {
    expect(minorAmount(value, currency, 'major')).toBe(expected)
  })
  it.each([Number.POSITIVE_INFINITY, Number.NaN, 9007199254740992])('rejects invalid amount %s', (value: number) => {
    expect(() => minorAmount(value, 'USD', 'major')).toThrow(PayloadValidationError)
  })
  it('does not round away fractional minor units', () => {
    expect(() => minorAmount(1.5, 'JPY', 'major')).toThrow()
  })
  it('preserves an explicit integer minor-unit amount', () => {
    expect(minorAmount(1999, 'USD', 'minor')).toBe(1999)
  })
  it.each(['a'.repeat(64), ' \t' + 'a'.repeat(64) + '\n'])(
    'hashes a raw customer ID even if its trimmed value looks like a SHA-256 hash: %j',
    (customerId) => {
      expect(formatEvent({ ...base, external_id: customerId }).user?.external_id_sha256).toBe(digest('a'.repeat(64)))
    }
  )
  it('rejects an ambiguous timestamp without a timezone', () => {
    expect(() => formatEvent({ ...base, timestamp: '2026-10-20T00:00:00' } as Payload)).toThrow()
  })
})
