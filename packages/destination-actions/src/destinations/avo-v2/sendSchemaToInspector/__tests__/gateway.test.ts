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

type Mode = 'single' | 'batch'

async function sendOne(
  event: SegmentEvent,
  mapping: Record<string, unknown> = {},
  settings: Record<string, string> = {},
  mode: Mode = 'single'
) {
  nock('https://api.avo.app').post(/.*/).reply(200, {})
  const input = {
    mapping,
    useDefaultMappings: true,
    settings: { apiKey: 'test-api-key', env: 'prod', ...settings }
  }
  const responses =
    mode === 'single'
      ? await testDestination.testAction('sendSchemaToInspector', { ...input, event })
      : await testDestination.testBatchAction('sendSchemaToInspector', { ...input, events: [event] })
  const post = responses.find((r) => r.options.method?.toLowerCase() === 'post')
  if (!post) throw new Error('no track request was sent')
  const bodies = JSON.parse(await post.request.text()) as Record<string, unknown>[]
  return { url: post.url, headers: post.request.headers, bodies }
}

afterEach(() => nock.cleanAll())

const propertyNames = (body: Record<string, unknown>) =>
  (body.eventProperties as { propertyName: string }[]).map((p) => p.propertyName)

const COORDINATE_KEYS = ['outputReference', 'originHint', 'appVersion'] as const

// Each fixture pins down one link of today's appVersion chain, which is the checkpoint
// default: the appVersionPropertyName setting, then the appVersion field, then 'unversioned'.
const checkpointFixtures = [
  {
    name: 'appVersionPropertyName setting',
    event: () => fixtureEvent({ properties: { plan: 'pro', build: '88.0' } }),
    settings: { appVersionPropertyName: 'build' },
    checkpointDefault: '88.0'
  },
  {
    name: 'appVersion field',
    event: () => fixtureEvent(),
    settings: {},
    checkpointDefault: '3.1.0'
  },
  {
    name: 'no version anywhere',
    event: () => fixtureEvent({ context: {} }),
    settings: {},
    checkpointDefault: 'unversioned'
  }
]

function expectCoordinates(
  body: Record<string, unknown>,
  expected: Record<string, unknown>,
  checkpointDefault: string
) {
  for (const key of COORDINATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(expected, key)) {
      const value = expected[key] === '<CHECKPOINT_DEFAULT>' ? checkpointDefault : expected[key]
      expect(body).toHaveProperty(key)
      expect(body[key]).toStrictEqual(value)
    } else {
      expect(Object.prototype.hasOwnProperty.call(body, key)).toBe(false)
    }
  }
  // The mapping field name never leaks onto the wire; it only sets appVersion.
  expect(body).not.toHaveProperty('originAppVersion')
}

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

  for (const mode of ['single', 'batch'] as Mode[]) {
    for (const fixture of checkpointFixtures) {
      describe(`shared coordinate vectors (${mode}, checkpoint default from ${fixture.name})`, () => {
        for (const { name, input, expected } of vectors.coordinateCases) {
          it(name, async () => {
            const { bodies } = await sendOne(fixture.event(), { ...input }, fixture.settings, mode)

            expect(bodies).toHaveLength(1)
            expectCoordinates(bodies[0], expected, fixture.checkpointDefault)
            // Coordinates are top-level siblings: the schema and stream are untouched.
            expect(propertyNames(bodies[0])).toStrictEqual(Object.keys(fixture.event().properties ?? {}))
            expect(bodies[0].streamId).toBe('anon-gw-1')
          })
        }
      })
    }
  }

  it(vectors.propertyCollisionCase.name, async () => {
    const { eventProperties, input, expected } = vectors.propertyCollisionCase
    const { bodies } = await sendOne(fixtureEvent({ properties: eventProperties }), { ...input })

    expectCoordinates(bodies[0], expected, '3.1.0')
    expect(propertyNames(bodies[0])).toStrictEqual(expected.eventPropertyNames)
  })

  it('coordinates are not batch keys', () => {
    expect(Destination.actions.sendSchemaToInspector.fields.batch_keys.default).toStrictEqual(['anonymousId', 'userId'])
  })

  it('events that differ only in coordinates are sent in one request, each with its own coordinates', async () => {
    const coordinates = [
      { outputReference: 'meta-x7k2q', originHint: 'android', originAppVersion: '4.2.0' },
      { originHint: 'ios', originAppVersion: '7.0.1' },
      { outputReference: 'ga4-p9d3m' }
    ]
    const expected = [
      { outputReference: 'meta-x7k2q', originHint: 'android', appVersion: '4.2.0' },
      { originHint: 'ios', appVersion: '7.0.1' },
      { outputReference: 'ga4-p9d3m', appVersion: '3.1.0' }
    ]
    nock('https://api.avo.app').post(/.*/).times(coordinates.length).reply(200, {})

    const responses = await testDestination.testBatchAction('sendSchemaToInspector', {
      events: coordinates.map((gateway) =>
        fixtureEvent({ context: { app: { name: 'Shop', version: '3.1.0' }, gateway } })
      ),
      mapping: {
        outputReference: { '@path': '$.context.gateway.outputReference' },
        originHint: { '@path': '$.context.gateway.originHint' },
        originAppVersion: { '@path': '$.context.gateway.originAppVersion' }
      },
      useDefaultMappings: true,
      settings: { apiKey: 'test-api-key', env: 'prod' }
    })

    const posts = responses.filter((r) => r.options.method?.toLowerCase() === 'post')
    expect(posts).toHaveLength(1)
    const bodies = JSON.parse(await posts[0].request.text()) as Record<string, unknown>[]
    expect(bodies).toHaveLength(coordinates.length)
    bodies.forEach((body, i) => {
      expectCoordinates(body, expected[i], 'unused')
      expect(body.streamId).toBe('anon-gw-1')
    })
  })

  describe('non-string mapping values', () => {
    // Map each coordinate through a path to an event property holding the untyped value,
    // as a customer mapping such as `$.context.app.build` would.
    const mapThroughPaths = (input: Record<string, unknown>) => ({
      event: fixtureEvent({ properties: { plan: 'pro', ...input } }),
      mapping: Object.fromEntries(Object.keys(input).map((key) => [key, { '@path': `$.properties.${key}` }]))
    })
    const hasStructuredValue = (input: Record<string, unknown>) =>
      Object.values(input).some((value) => typeof value === 'object' && value !== null)
    const scalarCases = vectors.untypedInputCases.cases.filter(({ input }) => !hasStructuredValue(input))
    const structuredCases = vectors.untypedInputCases.cases.filter(({ input }) => hasStructuredValue(input))

    it('the vector table has both kinds of untyped case', () => {
      expect(scalarCases).toHaveLength(3)
      expect(structuredCases).toHaveLength(1)
    })

    for (const mode of ['single', 'batch'] as Mode[]) {
      for (const { name, input, expected } of scalarCases) {
        it(`the framework omits null and stringifies scalars before perform (${mode}): ${name}`, async () => {
          const { event, mapping } = mapThroughPaths(input)
          const { bodies } = await sendOne(event, mapping, {}, mode)

          expectCoordinates(bodies[0], expected, '3.1.0')
        })
      }
    }

    it('the framework rejects the event when a coordinate resolves to an object or array', async () => {
      const { event, mapping } = mapThroughPaths(structuredCases[0].input)
      const track = nock('https://api.avo.app').post(/.*/).reply(200, {})

      await expect(
        testDestination.testAction('sendSchemaToInspector', {
          event,
          mapping,
          useDefaultMappings: true,
          settings: { apiKey: 'test-api-key', env: 'prod' }
        })
      ).rejects.toThrow(
        'Output Reference must be a string but it was an object. Origin Hint must be a string but it was an array.'
      )
      expect(track.isDone()).toBe(false)
    })

    it('in a batch, the framework fails only the event whose coordinate is an object or array', async () => {
      const rejected = mapThroughPaths(structuredCases[0].input)
      const accepted = fixtureEvent({ messageId: 'msg-gw-accepted' })
      let posted: Record<string, unknown>[] = []
      nock('https://api.avo.app')
        .post(/.*/, (body: Record<string, unknown>[]) => {
          posted = body
          return true
        })
        .reply(200, {})

      await testDestination.testBatchAction('sendSchemaToInspector', {
        events: [rejected.event, accepted],
        mapping: rejected.mapping,
        useDefaultMappings: true,
        settings: { apiKey: 'test-api-key', env: 'prod' }
      })

      const [multistatus] = testDestination.results.map((r) => (r as { multistatus: unknown[] }).multistatus)
      expect(multistatus[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage:
          'Output Reference must be a string but it was an object. Origin Hint must be a string but it was an array.'
      })
      expect(multistatus[1]).toMatchObject({ status: 200 })
      expect(posted.map((body) => body.messageId)).toStrictEqual(['msg-gw-accepted'])
    })
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
