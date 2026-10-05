import nock from 'nock'
import { createECDH } from 'crypto'
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
  settings: Record<string, unknown> = {},
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
  const posts = responses.filter((r) => r.options.method?.toLowerCase() === 'post')
  if (posts.length !== 1) throw new Error(`expected one track request, got ${posts.length}`)
  const bodies = JSON.parse(await posts[0].request.text()) as Record<string, unknown>[]
  return { url: posts[0].url, headers: posts[0].request.headers, bodies }
}

const GATEWAY = { gatewaySupport: true }

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
    checkpointDefault: '88.0',
    eventVersion: '88.0'
  },
  {
    name: 'appVersion field',
    event: () => fixtureEvent(),
    settings: {},
    checkpointDefault: '3.1.0',
    eventVersion: '3.1.0'
  },
  {
    name: 'no version anywhere',
    event: () => fixtureEvent({ context: {} }),
    settings: {},
    checkpointDefault: 'unversioned',
    eventVersion: null
  }
]

// fixtureEvent() carries context.app.version 3.1.0 and no App Version Property is set.
const FIXTURE_VERSIONS = { checkpointDefault: '3.1.0', eventVersion: '3.1.0' }

const TOKENS: Record<string, 'checkpointDefault' | 'eventVersion'> = {
  '<CHECKPOINT_DEFAULT>': 'checkpointDefault',
  '<EVENT_VERSION_OR_NULL>': 'eventVersion'
}

function expectCoordinates(
  body: Record<string, unknown>,
  expected: Record<string, unknown>,
  versions: { checkpointDefault: string; eventVersion: string | null }
) {
  for (const key of COORDINATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(expected, key)) {
      const token = typeof expected[key] === 'string' ? TOKENS[expected[key]] : undefined
      const value = token ? versions[token] : expected[key]
      expect(body).toHaveProperty(key)
      expect(body[key]).toStrictEqual(value)
    } else {
      expect(Object.prototype.hasOwnProperty.call(body, key)).toBe(false)
    }
  }
  // The mapping field name never leaks onto the wire; it only sets appVersion.
  expect(body).not.toHaveProperty('originAppVersion')
}

// What upstream main sends for fixtureEvent() with default mappings, before Gateway Support existed.
const LEGACY_URL = 'https://api.avo.app/inspector/segment/v1/track'
const LEGACY_HEADERS = {
  accept: 'application/json',
  'content-type': 'application/json',
  'api-key': 'test-api-key',
  env: 'prod',
  streamid: 'anon-gw-1',
  'user-agent': 'Segment (Actions)'
}
const LEGACY_BODY = {
  appName: 'Shop',
  appVersion: '3.1.0',
  libVersion: '2.0.0',
  libPlatform: 'Segment',
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

const headerMap = (headers: Headers) => Object.fromEntries([...headers.entries()])

describe('Avo.sendSchemaToInspector with Gateway Support off', () => {
  // Instances saved before the setting existed have no value for it at all.
  const offSettings: [string, Record<string, unknown>][] = [
    ['unset', {}],
    ['false', { gatewaySupport: false }]
  ]
  const allCoordinates = {
    outputReference: 'meta-x7k2q',
    originHint: 'android',
    originAppVersion: '4.2.0'
  }

  it('the runtime does not fill in the setting default for an instance saved without it', async () => {
    // onEvent is the production entry point: it validates the saved settings against the
    // settings schema (which carries `default: true`) and then runs the subscription.
    let posted: { url: string; body: unknown } | undefined
    nock('https://api.avo.app')
      .post(/.*/, (body) => {
        posted = { url: '', body }
        return true
      })
      .reply(200, function () {
        if (posted) posted.url = `https://api.avo.app${this.req.path}`
        return {}
      })

    // A separate instance, so the recorded responses don't leak into the other tests.
    await createTestIntegration(Destination).onEvent(fixtureEvent(), {
      apiKey: 'test-api-key',
      env: 'prod',
      subscription: {
        subscribe: 'type = "track"',
        partnerAction: 'sendSchemaToInspector',
        mapping: {
          event: { '@path': '$.event' },
          properties: { '@path': '$.properties' },
          messageId: { '@path': '$.messageId' },
          createdAt: { '@path': '$.timestamp' },
          appVersion: { '@path': '$.context.app.version' },
          appName: { '@path': '$.context.app.name' },
          anonymousId: { '@path': '$.anonymousId' },
          originHint: 'android'
        }
      }
    })

    expect(posted?.url).toBe(LEGACY_URL)
    expect(posted?.body).toStrictEqual([LEGACY_BODY])
  })

  for (const [label, settings] of offSettings) {
    for (const mode of ['single', 'batch'] as Mode[]) {
      it(`sends exactly the previous request (${label}, ${mode})`, async () => {
        const { url, headers, bodies } = await sendOne(fixtureEvent(), {}, settings, mode)

        expect(url).toBe(LEGACY_URL)
        expect(headerMap(headers)).toStrictEqual(LEGACY_HEADERS)
        expect(bodies).toStrictEqual([LEGACY_BODY])
      })

      it(`ignores mapped coordinates (${label}, ${mode})`, async () => {
        for (const mapping of [allCoordinates, { originHint: 'android' }]) {
          const { url, headers, bodies } = await sendOne(fixtureEvent(), mapping, settings, mode)

          expect(url).toBe(LEGACY_URL)
          expect(headerMap(headers)).toStrictEqual(LEGACY_HEADERS)
          expect(bodies).toStrictEqual([LEGACY_BODY])
        }
      })
    }
  }
})

describe('Avo.sendSchemaToInspector gateway coordinates', () => {
  it('a mapping without the gateway fields sends the previous body apart from endpoint, libPlatform and libVersion', async () => {
    const { url, bodies } = await sendOne(fixtureEvent(), {}, GATEWAY)

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
            const { bodies } = await sendOne(fixture.event(), { ...input }, { ...fixture.settings, ...GATEWAY }, mode)

            expect(bodies).toHaveLength(1)
            expectCoordinates(bodies[0], expected, fixture)
            // Coordinates are top-level siblings: the schema and stream are untouched.
            expect(propertyNames(bodies[0])).toStrictEqual(Object.keys(fixture.event().properties ?? {}))
            expect(bodies[0].streamId).toBe('anon-gw-1')
          })
        }
      })
    }
  }

  it('the event version standing in for an origin app version is trimmed, with or without a hint', async () => {
    const padded = fixtureEvent({ context: { app: { name: 'Shop', version: ' 3.1.0 ' } } })
    const withHint = await sendOne(padded, { originHint: 'ios' }, GATEWAY)
    const withoutHint = await sendOne(padded, {}, GATEWAY)
    // Positive control: with Gateway Support off the version is sent as Segment delivered it.
    const legacy = await sendOne(padded, {}, {})
    expect([
      withHint.bodies[0].appVersion,
      withoutHint.bodies[0].appVersion,
      legacy.bodies[0].appVersion
    ]).toStrictEqual(['3.1.0', '3.1.0', ' 3.1.0 '])
  })

  it('in gateway mode, a non-string App Version Property value is sent as its string, never throwing', async () => {
    const event = fixtureEvent({ properties: { plan: 'pro', build: 88 } })
    const withHint = await sendOne(event, { originHint: 'ios' }, { appVersionPropertyName: 'build', ...GATEWAY })
    const withoutHint = await sendOne(event, {}, { appVersionPropertyName: 'build', ...GATEWAY })
    // Positive control: with Gateway Support off the number is sent as before.
    const legacy = await sendOne(event, {}, { appVersionPropertyName: 'build' })
    expect([
      withHint.bodies[0].appVersion,
      withoutHint.bodies[0].appVersion,
      legacy.bodies[0].appVersion
    ]).toStrictEqual(['88', '88', 88])
  })

  it('in gateway mode, a blank App Version Property value falls back to the App Version field, and 0 is a version', async () => {
    const settings = { appVersionPropertyName: 'build', ...GATEWAY }
    const blank = await sendOne(
      fixtureEvent({ properties: { plan: 'pro', build: '  ' } }),
      { originHint: 'ios' },
      settings
    )
    const zero = await sendOne(fixtureEvent({ properties: { plan: 'pro', build: 0 } }), { originHint: 'ios' }, settings)
    // Positive control: with Gateway Support off the previous truthiness check still applies.
    const legacyZero = await sendOne(
      fixtureEvent({ properties: { plan: 'pro', build: 0 } }),
      {},
      { appVersionPropertyName: 'build' }
    )
    expect([blank.bodies[0].appVersion, zero.bodies[0].appVersion, legacyZero.bodies[0].appVersion]).toStrictEqual([
      '3.1.0',
      '0',
      '3.1.0'
    ])
  })

  it('an explicit Origin App Version wins over the App Version Property setting and the App Version field', async () => {
    const event = fixtureEvent({ properties: { plan: 'pro', build: '88.0' } })
    const { bodies } = await sendOne(
      event,
      { originHint: 'ios', originAppVersion: '7.0.1' },
      { appVersionPropertyName: 'build', ...GATEWAY }
    )
    expect(bodies[0].appVersion).toBe('7.0.1')
  })

  it(vectors.propertyCollisionCase.name, async () => {
    const { eventProperties, input, expected } = vectors.propertyCollisionCase
    const { bodies } = await sendOne(fixtureEvent({ properties: eventProperties }), { ...input }, GATEWAY)

    expectCoordinates(bodies[0], expected, FIXTURE_VERSIONS)
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
      settings: { apiKey: 'test-api-key', env: 'prod', ...GATEWAY }
    })

    const posts = responses.filter((r) => r.options.method?.toLowerCase() === 'post')
    expect(posts).toHaveLength(1)
    const bodies = JSON.parse(await posts[0].request.text()) as Record<string, unknown>[]
    expect(bodies).toHaveLength(coordinates.length)
    bodies.forEach((body, i) => {
      expectCoordinates(body, expected[i], FIXTURE_VERSIONS)
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
          const { bodies } = await sendOne(event, mapping, GATEWAY, mode)

          expectCoordinates(bodies[0], expected, FIXTURE_VERSIONS)
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
          settings: { apiKey: 'test-api-key', env: 'prod', ...GATEWAY }
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
        settings: { apiKey: 'test-api-key', env: 'prod', ...GATEWAY }
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
    const { url, headers, bodies } = await sendOne(fixtureEvent(), {}, { apiKey: 'key-123', env: 'prod', ...GATEWAY })

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

const schemaOf = (body: Record<string, unknown>) =>
  Object.fromEntries(
    (body.eventProperties as { propertyName: string; propertyType: string }[]).map((p) => [
      p.propertyName,
      p.propertyType
    ])
  )

describe('Gateway Inspection Scope (shared warehouse column vectors)', () => {
  const cases = vectors.warehouseColumnCases.cases

  it('the vector table carries every warehouse-column case', () => {
    expect(cases).toHaveLength(5)
  })

  // The harness also fills in Segment's default envelope fields, so the ones a case leaves out
  // are passed as explicitly absent.
  const ENVELOPE_FIELDS = [
    'anonymousId',
    'userId',
    'messageId',
    'timestamp',
    'originalTimestamp',
    'sentAt',
    'receivedAt'
  ]
  const asSent = (event: Record<string, unknown>) => ({
    ...Object.fromEntries(ENVELOPE_FIELDS.filter((field) => !(field in event)).map((field) => [field, undefined])),
    ...event
  })

  for (const mode of ['single', 'batch'] as Mode[]) {
    for (const { name, scope, event, expectedSchema } of cases) {
      it(`${mode}: ${name}`, async () => {
        const { bodies } = await sendOne(
          asSent(event) as unknown as SegmentEvent,
          {},
          { ...GATEWAY, inspectedFields: scope },
          mode
        )
        expect(schemaOf(bodies[0])).toStrictEqual(expectedSchema)
      })
    }
  }

  const everything = cases[2]
  const eventOnly = cases[0]

  it('without Gateway Support, Gateway Inspection Scope is ignored', async () => {
    const { url, bodies } = await sendOne(
      everything.event as unknown as SegmentEvent,
      {},
      {
        inspectedFields: 'everything'
      }
    )
    expect(url).toBe('https://api.avo.app/inspector/segment/v1/track')
    expect(schemaOf(bodies[0])).toStrictEqual(eventOnly.expectedSchema)
  })

  it('a destination saved before Gateway Inspection Scope existed inspects the event properties only', async () => {
    const { bodies } = await sendOne(everything.event as unknown as SegmentEvent, {}, GATEWAY)
    expect(schemaOf(bodies[0])).toStrictEqual(eventOnly.expectedSchema)
  })

  it('warehouse columns never carry a value, even with a public encryption key', async () => {
    const recipient = createECDH('prime256v1')
    recipient.generateKeys()
    const publicEncryptionKey = recipient.getPublicKey('hex', 'uncompressed')
    const { bodies } = await sendOne(
      asSent(everything.event) as unknown as SegmentEvent,
      {},
      {
        ...GATEWAY,
        env: 'dev',
        publicEncryptionKey,
        inspectedFields: 'everything'
      }
    )
    const properties = bodies[0].eventProperties as {
      propertyName: string
      encryptedPropertyValue?: string
      children?: unknown
    }[]
    const columns = properties.filter((p) => !(p.propertyName in eventOnly.expectedSchema))
    // Positive controls: the columns really are in the body, and encryption is really on.
    expect(columns.map((p) => p.propertyName).sort()).toStrictEqual(
      Object.keys(everything.expectedSchema)
        .filter((name) => !(name in eventOnly.expectedSchema))
        .sort()
    )
    expect(properties.filter((p) => p.encryptedPropertyValue !== undefined).map((p) => p.propertyName)).toStrictEqual(
      Object.keys(eventOnly.expectedSchema)
    )
    expect(columns.filter((p) => p.encryptedPropertyValue !== undefined || p.children !== undefined)).toStrictEqual([])
  })

  it('a mapping saved before Gateway Inspection Scope existed still gets the columns', async () => {
    nock('https://api.avo.app').post(/.*/).reply(200, {})
    const responses = await testDestination.testAction('sendSchemaToInspector', {
      event: asSent(everything.event) as unknown as SegmentEvent,
      useDefaultMappings: false,
      mapping: {
        event: { '@path': '$.event' },
        properties: { '@path': '$.properties' },
        messageId: { '@path': '$.messageId' },
        createdAt: { '@path': '$.timestamp' },
        anonymousId: { '@path': '$.anonymousId' },
        userId: { '@path': '$.userId' }
      },
      settings: { apiKey: 'test-api-key', env: 'prod', ...GATEWAY, inspectedFields: 'everything' }
    })
    const post = responses.find((r) => r.options.method?.toLowerCase() === 'post')
    const bodies = JSON.parse(await (post?.request.text() ?? Promise.resolve('[]'))) as Record<string, unknown>[]
    expect(schemaOf(bodies[0])).toStrictEqual(everything.expectedSchema)
  })

  it('in a batch, each event gets its own columns even when another event fails validation', async () => {
    nock('https://api.avo.app').post(/.*/).reply(200, {})
    const invalid = { ...asSent(everything.event), messageId: 'msg-invalid', event: undefined }
    const first = asSent({
      ...everything.event,
      messageId: 'msg-a',
      properties: { plan: 'pro' },
      context: { locale: 'de-DE' }
    })
    const second = asSent({
      ...everything.event,
      messageId: 'msg-b',
      properties: { plan: 'pro' },
      context: { timezone: 'Europe/Oslo' }
    })
    const responses = await testDestination.testBatchAction('sendSchemaToInspector', {
      events: [invalid, first, second] as unknown as SegmentEvent[],
      useDefaultMappings: true,
      mapping: {},
      settings: { apiKey: 'test-api-key', env: 'prod', ...GATEWAY, inspectedFields: 'event+context' }
    })
    const post = responses.find((r) => r.options.method?.toLowerCase() === 'post')
    const bodies = JSON.parse(await (post?.request.text() ?? Promise.resolve('[]'))) as Record<string, unknown>[]
    expect(
      bodies.map((body) => [body.messageId, Object.keys(schemaOf(body)).filter((n) => n.startsWith('context_'))])
    ).toStrictEqual([
      ['msg-a', ['context_locale']],
      ['msg-b', ['context_timezone']]
    ])
  })

  const contextColumnsByBody = async (events: Record<string, unknown>[], mapping: Record<string, unknown> = {}) => {
    nock('https://api.avo.app').post(/.*/).reply(200, {})
    const responses = await testDestination.testBatchAction('sendSchemaToInspector', {
      events: events as unknown as SegmentEvent[],
      useDefaultMappings: true,
      mapping,
      settings: { apiKey: 'test-api-key', env: 'prod', ...GATEWAY, inspectedFields: 'event+context' }
    })
    const post = responses.find((r) => r.options.method?.toLowerCase() === 'post')
    const bodies = JSON.parse(await (post?.request.text() ?? Promise.resolve('[]'))) as Record<string, unknown>[]
    return bodies.map((body) => Object.keys(schemaOf(body)).filter((n) => n.startsWith('context_')))
  }
  const withContext = (messageId: string, context: Record<string, unknown>) =>
    asSent({ ...everything.event, messageId, properties: { plan: 'pro' }, context })

  it('a single event gets its columns even when Message ID is mapped to another field', async () => {
    nock('https://api.avo.app').post(/.*/).reply(200, {})
    const responses = await testDestination.testAction('sendSchemaToInspector', {
      event: asSent(everything.event) as unknown as SegmentEvent,
      useDefaultMappings: true,
      mapping: { messageId: { '@path': '$.properties.orderId' } },
      settings: { apiKey: 'test-api-key', env: 'prod', ...GATEWAY, inspectedFields: 'everything' }
    })
    const post = responses.find((r) => r.options.method?.toLowerCase() === 'post')
    const bodies = JSON.parse(await (post?.request.text() ?? Promise.resolve('[]'))) as Record<string, unknown>[]
    // Positive control: the remapped Message ID really differs from the raw event's.
    expect(bodies[0].messageId).not.toBe(everything.event.messageId)
    expect(Object.keys(schemaOf(bodies[0])).sort()).toStrictEqual(Object.keys(everything.expectedSchema).sort())
  })

  it('in a batch with no failed events, each event gets its own columns even when Message ID is remapped', async () => {
    const columns = await contextColumnsByBody(
      [withContext('msg-a', { locale: 'de-DE' }), withContext('msg-b', { timezone: 'Europe/Oslo' })],
      { messageId: { '@path': '$.properties.plan' } }
    )
    expect(columns).toStrictEqual([['context_locale'], ['context_timezone']])
  })

  it('in a batch, events sharing a Message ID each get their own columns', async () => {
    const columns = await contextColumnsByBody([
      withContext('msg-dup', { locale: 'de-DE' }),
      withContext('msg-dup', { timezone: 'Europe/Oslo' })
    ])
    expect(columns).toStrictEqual([['context_locale'], ['context_timezone']])
  })

  it('in a batch with a failed event, events sharing a Message ID each get their own columns', async () => {
    const invalid = { ...asSent(everything.event), messageId: 'msg-invalid', event: undefined }
    const columns = await contextColumnsByBody([
      invalid,
      withContext('msg-dup', { locale: 'de-DE' }),
      withContext('msg-dup', { timezone: 'Europe/Oslo' })
    ])
    expect(columns).toStrictEqual([['context_locale'], ['context_timezone']])
  })

  // Web sources send no context.app, so their version has to come from an event property.
  it('tells web sources to point App Version Property at the property carrying the version', () => {
    const description = Destination.actions.sendSchemaToInspector.fields.originAppVersion.description
    expect([
      description.includes('`$.context.app.version`'),
      description.includes('set the App Version Property setting'),
      description.includes('`app_version`')
    ]).toStrictEqual([true, true, true])
  })

  // Avo's Inspector setup tab and docs quote these labels.
  it('is labelled Gateway Inspection Scope and offers the shared scopes, defaulting to everything', () => {
    const setting = Destination.authentication?.fields.inspectedFields
    expect(setting?.label).toBe('Gateway Inspection Scope')
    expect(setting?.choices).toStrictEqual([
      { label: 'Event properties', value: 'event' },
      { label: 'Event properties and context', value: 'event+context' },
      { label: 'Everything the warehouse stores', value: 'everything' }
    ])
    expect(setting?.default).toBe('everything')
  })
})
