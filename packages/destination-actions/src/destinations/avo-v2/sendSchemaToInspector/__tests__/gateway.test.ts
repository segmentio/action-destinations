import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import vectors from './gateway-vectors.json'

const testDestination = createTestIntegration(Destination)

const segment = vectors.platforms.segment

const fixtureEvent = (overrides: Partial<SegmentEvent> = {}) =>
  createTestEvent({
    anonymousId: 'anon-gw-1',
    messageId: 'msg-gw-1',
    timestamp: '2026-01-01T00:00:00.000Z',
    event: 'Checkout Started',
    properties: { plan: 'pro' },
    context: { app: { name: 'Shop', version: '3.1.0' } },
    ...overrides
  })

async function sendOne(event: SegmentEvent, mapping: Record<string, unknown> = {}, settings = {}) {
  nock('https://api.avo.app').post(/.*/).reply(200, {})
  const responses = await testDestination.testAction('sendSchemaToInspector', {
    event,
    mapping,
    useDefaultMappings: true,
    settings: { apiKey: 'test-api-key', env: 'prod', ...settings }
  })
  const post = responses.find((r) => r.options.method?.toLowerCase() === 'post')
  if (!post) throw new Error('no track request was sent')
  const bodies = JSON.parse(await post.request.text()) as Record<string, unknown>[]
  return { url: post.url, headers: post.request.headers, bodies }
}

afterEach(() => nock.cleanAll())

describe('Avo.sendSchemaToInspector gateway coordinates', () => {
  it('a mapping without the gateway fields sends the pre-existing body', async () => {
    const { url, bodies } = await sendOne(fixtureEvent())

    expect(url).toBe(segment.url)
    expect(bodies).toStrictEqual([
      {
        appName: 'Shop',
        appVersion: '3.1.0',
        libVersion: segment.libVersion,
        libPlatform: segment.libPlatform,
        messageId: 'msg-gw-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        sessionId: '',
        type: 'event',
        streamId: 'anon-gw-1',
        eventName: 'Checkout Started',
        eventProperties: [{ propertyName: 'plan', propertyType: 'string' }],
        eventId: null,
        eventHash: null
      }
    ])
  })

  it('posts to the v2 track endpoint with the client header matching every body libPlatform', async () => {
    const { url, headers, bodies } = await sendOne(fixtureEvent(), {}, { apiKey: 'key-123', env: 'prod' })

    expect(url).toBe(segment.url)
    expect(headers.get('api-key')).toBe('key-123')
    expect(headers.get('env')).toBe('prod')
    for (const [name, value] of Object.entries(segment.headers)) {
      expect(headers.get(name)).toBe(value)
    }
    for (const body of bodies) {
      expect(body.libPlatform).toBe(segment.libPlatform)
      expect(body.libPlatform).toBe(headers.get('X-Avo-Client'))
      expect(body.libVersion).toBe(segment.libVersion)
    }
  })
})
