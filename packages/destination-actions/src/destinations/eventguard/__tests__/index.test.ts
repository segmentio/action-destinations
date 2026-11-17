import nock from 'nock'
import { createTestIntegration, createTestEvent, Destination } from '@segment/actions-core'
import definition from '../index'
import { API_BASE_URL } from '../api'
import { API_VERSION } from '../versioning-info'

const integration = createTestIntegration(definition)
const connectionKey = 'synthetic-eventguard-key-not-a-credential'
const settings = { connectionKey }
const event = {
  type: 'track' as const,
  event: 'Checkout Started',
  messageId: 'synthetic-event-1',
  anonymousId: 'synthetic-visitor',
  timestamp: '2026-01-01T12:00:00.000Z',
  properties: { total: 42, currency: 'EUR', nested: { enabled: true }, tags: ['test'], empty: null },
  context: { library: { name: 'synthetic-test', version: '1' }, traits: { email: 'person@example.test' } }
}

beforeAll(() => nock.disableNetConnect())
afterEach(() => {
  const pending = nock.pendingMocks()
  nock.cleanAll()
  expect(pending).toEqual([])
})
afterAll(() => nock.enableNetConnect())

describe('EventGuard destination contract', () => {
  it('declares the receiver API version without changing the stable endpoint', () => {
    expect(API_VERSION).toBe('v1')
    expect(API_BASE_URL).toBe('https://eventguard.io/v1/segment')
  })
  it('exposes one required masked key and a complete-event automatic preset', () => {
    const fields = definition.authentication?.fields
    expect(Object.keys(fields ?? {})).toEqual(['connectionKey'])
    expect(fields?.connectionKey).toMatchObject({ required: true, type: 'password' })
    expect(definition.presets).toEqual([
      expect.objectContaining({
        type: 'automatic',
        partnerAction: 'sendTrack',
        subscribe: 'type = "track"',
        mapping: { data: { '@path': '$.' } }
      })
    ])
    expect(Object.keys(definition.actions)).toEqual(['sendTrack'])
  })

  it('validates a key through a GET without submitting an event', async () => {
    nock(API_BASE_URL).get('/connection').matchHeader('authorization', `Bearer ${connectionKey}`).reply(200, {
      connected: true
    })
    await expect(integration.testAuthentication(settings)).resolves.not.toThrow()
  })

  it.each([401, 403, 429, 503])('does not turn authentication status %s into success', async (status) => {
    nock(API_BASE_URL).get('/connection').reply(status, { error: 'Synthetic error' })
    // The official helper wraps auth HTTP failures in a credential error.
    await expect(integration.testAuthentication(settings)).rejects.toThrow(new RegExp(String(status)))
  })

  it.each(['', ' ', 'bad key', 'bad\nkey', 'bad\u0000key', 'bad\u001fkey', 'bad\u007fkey'])(
    'rejects unusable keys without making a network request',
    async (key) => {
      await expect(integration.testAuthentication({ connectionKey: key })).rejects.toThrow()
    }
  )

  it('preserves the complete event with the official default mapping', async () => {
    const sdkEvent = createTestEvent(event)
    nock(API_BASE_URL)
      .post('/track', (body: unknown) => {
        expect(body).toEqual(JSON.parse(JSON.stringify(sdkEvent)) as unknown)
        return true
      })
      .matchHeader('authorization', `Bearer ${connectionKey}`)
      .reply(202, { accepted: true })
    const result = await integration.testAction('sendTrack', {
      settings,
      event: sdkEvent,
      useDefaultMappings: true
    })
    expect(result[0].status).toBe(202)
  })

  it.each([200, 202])('accepts receiver status %s without changing the body', async (status) => {
    nock(API_BASE_URL).post('/track', event).reply(status)
    const result = await integration.testAction('sendTrack', { settings, mapping: { data: event } })
    expect(result[0].status).toBe(status)
  })

  it('retains request-body snapshots for required fields', async () => {
    const minimal = { type: 'track', event: 'App Opened', messageId: 'synthetic-minimal' }
    nock(API_BASE_URL).post('/track', minimal).reply(202)
    const result = await integration.testAction('sendTrack', { settings, mapping: { data: minimal } })
    expect(JSON.parse(await result[0].request.text())).toMatchSnapshot()
  })

  it('retains request-body snapshots for nested event fields', async () => {
    nock(API_BASE_URL).post('/track', event).reply(202)
    const result = await integration.testAction('sendTrack', { settings, mapping: { data: event } })
    expect(JSON.parse(await result[0].request.text())).toMatchSnapshot()
  })

  it.each([400, 401, 403, 409, 413, 429, 500, 501, 503])(
    'preserves delivery status %s for Segment error handling without an inline retry',
    async (status) => {
      const scope = nock(API_BASE_URL).post('/track').once().reply(status, { error: 'Synthetic error' })
      await expect(integration.testAction('sendTrack', { settings, mapping: { data: event } })).rejects.toMatchObject({
        response: { status }
      })
      expect(scope.isDone()).toBe(true)
    }
  )

  it('does not follow a redirect that could disclose the connection key', async () => {
    nock(API_BASE_URL).post('/track').reply(307, undefined, { location: 'https://untrusted.example.test/collect' })
    await expect(integration.testAction('sendTrack', { settings, mapping: { data: event } })).rejects.toThrow()
  })

  it.each([
    { ...event, type: 'identify' },
    { ...event, event: '' },
    { ...event, event: ' ' },
    { ...event, messageId: null },
    { ...event, messageId: '' },
    { ...event, messageId: 'x'.repeat(257) },
    { ...event, properties: [] },
    { ...event, properties: null },
    { ...event, properties: { data: 'x'.repeat(65536) } },
    { ...event, properties: { data: 'é'.repeat(33000) } }
  ])('rejects invalid Track payloads before delivery (%#)', async (invalid) => {
    await expect(integration.testAction('sendTrack', { settings, mapping: { data: invalid } })).rejects.toThrow()
  })

  it.each(['identify', 'page', 'screen', 'group', 'alias'] as const)('filters %s through the preset', async (type) => {
    const runtime = new Destination(definition)
    const preset = definition.presets?.[0]
    if (!preset) throw new Error('The automatic preset is missing')
    const { type: _presetType, ...subscription } = preset
    await runtime.onEvent(createTestEvent({ ...event, type }), { ...settings, subscriptions: [subscription] })
  })
})
