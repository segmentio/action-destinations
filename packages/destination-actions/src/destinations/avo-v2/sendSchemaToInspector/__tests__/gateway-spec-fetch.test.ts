import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { eventSpecKey } from '../functions/functions'

const testDestination = createTestIntegration(Destination)

const SPEC_PATH = '/trackingPlan/eventSpec'
const LEGACY_URL =
  'https://api.avo.app/trackingPlan/eventSpec?apiKey=test-api-key&streamId=anon-gw-1&eventName=Checkout+Started'

const metadata = { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' }

// A spec in which `plan` may only be `allowed`, attributed to `eventId`.
const specAllowing = (eventId: string, allowed: string) => ({
  events: [
    { b: 'main', id: eventId, vids: [], p: { plan: { t: 'string', r: true, v: { [`["${allowed}"]`]: [eventId] } } } }
  ],
  metadata
})

const fixtureEvent = (overrides: Partial<SegmentEvent> = {}) =>
  createTestEvent({
    anonymousId: 'anon-gw-1',
    event: 'Checkout Started',
    properties: { plan: 'pro' },
    ...overrides
  })

type Body = Record<string, unknown> & { eventProperties: { propertyName: string; failedEventIds?: string[] }[] }

async function run(
  events: SegmentEvent[],
  mapping: Record<string, unknown> = {},
  settings: Record<string, unknown> = {}
): Promise<{ specUrls: string[]; bodies: Body[] }> {
  nock('https://api.avo.app').post(/.*/).reply(200, {})
  const input = {
    mapping,
    useDefaultMappings: true,
    settings: { apiKey: 'test-api-key', env: 'dev', ...settings }
  }
  const responses =
    events.length === 1
      ? await testDestination.testAction('sendSchemaToInspector', { ...input, event: events[0] })
      : await testDestination.testBatchAction('sendSchemaToInspector', { ...input, events })
  const specUrls = responses.filter((r) => r.options.method?.toUpperCase() === 'GET').map((r) => r.url)
  const posts = responses.filter((r) => r.options.method?.toLowerCase() === 'post')
  if (posts.length !== 1) throw new Error(`expected one track request, got ${posts.length}`)
  const text: string = await posts[0].request.text()
  const bodies = JSON.parse(text) as Body[]
  return { specUrls, bodies }
}

const failedIds = (body: Body, name = 'plan') =>
  body.eventProperties.find((p) => p.propertyName === name)?.failedEventIds

const GATEWAY = { gatewaySupport: true }

afterEach(() => nock.cleanAll())

describe('Avo.sendSchemaToInspector event spec fetch with gateway coordinates', () => {
  describe('the request is unchanged without coordinates', () => {
    it('Gateway Support off: the spec URL is byte-identical even when coordinates are mapped', async () => {
      nock('https://api.avo.app').get(SPEC_PATH).query(true).reply(200, specAllowing('evt_src', 'pro'))
      const { specUrls, bodies } = await run([fixtureEvent()], { originHint: 'ios-app', outputReference: 'out-1' })
      expect(specUrls).toEqual([LEGACY_URL])
      expect(bodies[0]).not.toHaveProperty('originHint')
      expect(bodies[0]).not.toHaveProperty('outputReference')
    })

    it('Gateway Support on, no coordinates mapped: the spec URL is byte-identical', async () => {
      nock('https://api.avo.app').get(SPEC_PATH).query(true).reply(200, specAllowing('evt_src', 'pro'))
      const { specUrls } = await run([fixtureEvent()], {}, GATEWAY)
      expect(specUrls).toEqual([LEGACY_URL])
    })

    it('Gateway Support on, blank coordinates: the spec URL is byte-identical (no empty params)', async () => {
      nock('https://api.avo.app').get(SPEC_PATH).query(true).reply(200, specAllowing('evt_src', 'pro'))
      const { specUrls } = await run([fixtureEvent()], { originHint: '   ', outputReference: '' }, GATEWAY)
      expect(specUrls).toEqual([LEGACY_URL])
    })

    it('prod never fetches a spec, with or without coordinates', async () => {
      // A spec is on offer, so a wrongful fetch would be answered (and consumed) rather than
      // swallowed by the fetch's catch.
      const spec = nock('https://api.avo.app').get(SPEC_PATH).query(true).reply(200, specAllowing('evt_src', 'pro'))
      const { specUrls, bodies } = await run([fixtureEvent()], { originHint: 'ios-app' }, { ...GATEWAY, env: 'prod' })
      expect(specUrls).toEqual([])
      expect(spec.isDone()).toBe(false)
      expect(bodies[0]).not.toHaveProperty('eventSpecMetadata')
    })

    it('staging fetches the spec with the coordinates, like dev', async () => {
      nock('https://api.avo.app').get(SPEC_PATH).query(true).reply(200, specAllowing('evt_in', 'pro'))
      const { specUrls } = await run([fixtureEvent()], { originHint: 'ios-app' }, { ...GATEWAY, env: 'staging' })
      expect(specUrls).toEqual([`${LEGACY_URL}&originHint=ios-app`])
    })
  })

  describe('the request carries the coordinates the body carries', () => {
    it('origin hint only', async () => {
      nock('https://api.avo.app').get(SPEC_PATH).query(true).reply(200, specAllowing('evt_in', 'pro'))
      const { specUrls, bodies } = await run([fixtureEvent()], { originHint: 'ios-app' }, GATEWAY)
      expect(specUrls).toEqual([`${LEGACY_URL}&originHint=ios-app`])
      expect(bodies[0].originHint).toBe('ios-app')
    })

    it('origin hint and output reference', async () => {
      nock('https://api.avo.app').get(SPEC_PATH).query(true).reply(200, specAllowing('evt_out', 'pro'))
      const { specUrls } = await run([fixtureEvent()], { originHint: 'ios-app', outputReference: 'out-1' }, GATEWAY)
      expect(specUrls).toEqual([`${LEGACY_URL}&originHint=ios-app&outputReference=out-1`])
    })

    it('output reference only', async () => {
      nock('https://api.avo.app').get(SPEC_PATH).query(true).reply(200, specAllowing('evt_out', 'pro'))
      const { specUrls } = await run([fixtureEvent()], { outputReference: 'out-1' }, GATEWAY)
      expect(specUrls).toEqual([`${LEGACY_URL}&outputReference=out-1`])
    })

    it('sends the trimmed values, encoded, and omits a blank one', async () => {
      nock('https://api.avo.app').get(SPEC_PATH).query(true).reply(200, specAllowing('evt_in', 'pro'))
      const { specUrls, bodies } = await run(
        [fixtureEvent()],
        { originHint: '  ios app&x=1  ', outputReference: '  ' },
        GATEWAY
      )
      expect(specUrls).toEqual([`${LEGACY_URL}&originHint=ios+app%26x%3D1`])
      expect(bodies[0].originHint).toBe('ios app&x=1')
      expect(bodies[0]).not.toHaveProperty('outputReference')
    })
  })

  describe('one spec per event name and checkpoint', () => {
    it('cache keys differ per coordinates', () => {
      const keys = [
        eventSpecKey('E', {}),
        eventSpecKey('E', { originHint: 'ios' }),
        eventSpecKey('E', { originHint: 'ios', outputReference: 'out-1' }),
        eventSpecKey('E', { outputReference: 'out-1' }),
        eventSpecKey('E', { originHint: 'android' })
      ]
      expect(new Set(keys).size).toBe(keys.length)
      expect(eventSpecKey('E', { originHint: 'ios' })).toBe(eventSpecKey('E', { originHint: 'ios' }))
    })

    it('in a batch, each checkpoint gets its own fetch and each event is validated against its own spec', async () => {
      const coordinateMapping = {
        originHint: { '@path': '$.properties.hint' },
        outputReference: { '@path': '$.properties.output' }
      }
      const scope = nock('https://api.avo.app')
      // Source spec allows "pro"; gateway-input spec allows "free"; output spec allows "team".
      scope
        .get(SPEC_PATH)
        .query((q) => q.originHint === undefined && q.outputReference === undefined)
        .once()
        .reply(200, specAllowing('evt_src', 'pro'))
      scope
        .get(SPEC_PATH)
        .query((q) => q.originHint === 'ios' && q.outputReference === undefined)
        .once()
        .reply(200, specAllowing('evt_in', 'free'))
      scope
        .get(SPEC_PATH)
        .query((q) => q.originHint === 'ios' && q.outputReference === 'out-1')
        .once()
        .reply(200, specAllowing('evt_out', 'team'))

      const { specUrls, bodies } = await run(
        [
          fixtureEvent({ properties: { plan: 'pro' } }),
          fixtureEvent({ properties: { plan: 'pro', hint: 'ios' } }),
          fixtureEvent({ properties: { plan: 'pro', hint: 'ios', output: 'out-1' } }),
          // Same checkpoint as the previous event: reuses its fetch.
          fixtureEvent({ properties: { plan: 'team', hint: ' ios ', output: 'out-1' } })
        ],
        coordinateMapping,
        GATEWAY
      )

      expect(specUrls).toHaveLength(3)
      expect(scope.isDone()).toBe(true)
      // Each value fails every spec but its own, so no failures plus spec metadata (a spec was
      // found) means the event was matched to its own checkpoint's spec, not to none.
      expect(failedIds(bodies[0])).toBeUndefined()
      expect(bodies[0].eventSpecMetadata).toEqual(metadata)
      expect(failedIds(bodies[1])).toEqual(['evt_in'])
      expect(failedIds(bodies[2])).toEqual(['evt_out'])
      expect(failedIds(bodies[3])).toBeUndefined()
      expect(bodies[3].eventSpecMetadata).toEqual(metadata)
    })
    it('in a batch, one checkpoint answering 404 leaves the others validated', async () => {
      const scope = nock('https://api.avo.app')
      scope
        .get(SPEC_PATH)
        .query((q) => q.originHint === undefined)
        .once()
        .reply(404, { error: 'event_not_found', name: 'Checkout Started' })
      scope
        .get(SPEC_PATH)
        .query((q) => q.originHint === 'ios')
        .once()
        .reply(200, specAllowing('evt_in', 'free'))

      const { bodies } = await run(
        [fixtureEvent({ properties: { plan: 'pro' } }), fixtureEvent({ properties: { plan: 'pro', hint: 'ios' } })],
        { originHint: { '@path': '$.properties.hint' } },
        GATEWAY
      )

      expect(scope.isDone()).toBe(true)
      expect(bodies[0]).not.toHaveProperty('eventSpecMetadata')
      expect(failedIds(bodies[0])).toBeUndefined()
      expect(failedIds(bodies[1])).toEqual(['evt_in'])
      expect(bodies[1].eventSpecMetadata).toEqual(metadata)
    })
  })

  describe('a gateway key without an origin hint', () => {
    it('answers 404 and the event is still sent, unvalidated', async () => {
      nock('https://api.avo.app')
        .get(SPEC_PATH)
        .query(true)
        .reply(404, { error: 'event_not_found', name: 'Checkout Started' })
      const { specUrls, bodies } = await run([fixtureEvent()], { outputReference: 'out-1' }, GATEWAY)
      expect(specUrls).toHaveLength(1)
      expect(bodies).toHaveLength(1)
      expect(bodies[0].eventName).toBe('Checkout Started')
      expect(bodies[0].outputReference).toBe('out-1')
      expect(bodies[0]).not.toHaveProperty('eventSpecMetadata')
      expect(failedIds(bodies[0])).toBeUndefined()
    })
  })
})
