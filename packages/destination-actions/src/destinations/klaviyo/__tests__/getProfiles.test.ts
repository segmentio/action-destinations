import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { API_URL, GET_PROFILES_CONCURRENCY, KLAVIYO_PAGINATE_GET_PROFILES_FLAG } from '../config'
import Klaviyo from '../index'

// STRATCONN-7111. The fake Klaviyo mimics the limits measured on the real API:
// page[size] default 20 / max 100, and any() accepts at most 100 values.
const testDestination = createTestIntegration(Klaviyo)
const settings = { api_key: 'my-api-key' }
const listId = 'LIST1'
const emailMapping = { email: { '@path': '$.properties.email' }, list_id: listId }
const features = { [KLAVIYO_PAGINATE_GET_PROFILES_FLAG]: true }

const makeEvents = (n: number, prefix = 'user') =>
  Array.from({ length: n }, (_, i) =>
    createTestEvent({
      type: 'track',
      event: 'Audience Exited',
      properties: { email: `${prefix}${i}@example.com`, external_id: `${prefix}-ext-${i}` }
    })
  )

let removedIds: string[]
let removeRequestSizes: number[]
let getRequests: string[]
let maxInFlightGets: number

interface MockOptions {
  // number of profiles returned per matching value (to exercise links.next)
  profilesPerValue?: number
  // artificial latency of each lookup, so concurrent lookups overlap
  delayMs?: number
  // lookups whose filter contains this text get a 429
  rateLimitLookupsContaining?: string
  // the remove request with this number (1-based) gets a 500
  failRemoveRequestNumber?: number
}

function mockKlaviyo({
  profilesPerValue = 1,
  delayMs = 0,
  rateLimitLookupsContaining,
  failRemoveRequestNumber
}: MockOptions = {}) {
  removedIds = []
  removeRequestSizes = []
  getRequests = []
  maxInFlightGets = 0
  let inFlightGets = 0
  nock(API_URL)
    .persist()
    .get(/\/profiles\/.*/)
    .delay(delayMs)
    .reply(function (uri) {
      inFlightGets++
      maxInFlightGets = Math.max(maxInFlightGets, inFlightGets)
      setTimeout(() => inFlightGets--, delayMs)
      getRequests.push(decodeURIComponent(uri))
      const url = new URL(uri, 'https://a.klaviyo.com')
      const filter = url.searchParams.get('filter') ?? ''
      if (rateLimitLookupsContaining && filter.includes(rateLimitLookupsContaining)) {
        return [429, { errors: [{ detail: 'Request was throttled.' }] }]
      }
      const values = [...filter.matchAll(/"([^"]+)"/g)].map((m) => m[1])
      if (values.length > 100) {
        return [400, { errors: [{ detail: 'Maximum number of profile filter values is 100' }] }]
      }
      const pageSize = Number(url.searchParams.get('page[size]') ?? 20)
      if (pageSize > 100) {
        return [400, { errors: [{ detail: 'Page size must be an integer between 1 and 100' }] }]
      }
      const offset = Number(url.searchParams.get('page[cursor]') ?? 0)
      const all = values.flatMap((v) => Array.from({ length: profilesPerValue }, (_, i) => `id-${v}-${i}`))
      const data = all.slice(offset, offset + pageSize).map((id) => ({ id }))
      const links =
        all.length > offset + pageSize
          ? {
              next: `${API_URL}/profiles/?filter=${encodeURIComponent(filter)}&page[size]=${pageSize}&page[cursor]=${
                offset + pageSize
              }`
            }
          : {}
      return [200, { data, links }]
    })
  nock(API_URL)
    .persist()
    .delete(`/lists/${listId}/relationships/profiles/`)
    .reply(function (_uri, body: any) {
      removeRequestSizes.push(body.data.length)
      if (removeRequestSizes.length === failRemoveRequestNumber) {
        return [500, { errors: [{ detail: 'Internal error' }] }]
      }
      removedIds.push(...body.data.map((p: any) => p.id))
      return [202, {}]
    })
}

describe.each(['removeProfileFromList', 'removeProfile'])('Klaviyo %s getProfiles batching', (actionName) => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('flag off (legacy behavior)', () => {
    it('sends a single un-paginated request and only removes the first page', async () => {
      mockKlaviyo()
      await testDestination.executeBatch(actionName, { events: makeEvents(50), settings, mapping: emailMapping })
      expect(getRequests).toHaveLength(1)
      expect(getRequests[0]).not.toContain('page[size]')
      expect(removedIds).toHaveLength(20)
    })
  })

  describe('flag on', () => {
    it.each([
      [1, 1],
      [20, 1],
      [99, 1],
      [100, 1],
      [101, 2],
      [250, 3]
    ])('%i distinct emails -> %i GET request(s), all profiles removed', async (n, expectedGets) => {
      mockKlaviyo()
      const response = await testDestination.executeBatch(actionName, {
        events: makeEvents(n),
        settings,
        mapping: emailMapping,
        features
      })
      expect(response.every((r: any) => r.status === 200)).toBe(true)
      expect(getRequests).toHaveLength(expectedGets)
      getRequests.forEach((r) => expect(r).toContain('page[size]=100'))
      expect(removedIds).toHaveLength(n)
      expect(new Set(removedIds).size).toBe(n)
    })

    it('chunks every identifier type separately', async () => {
      mockKlaviyo()
      await testDestination.executeBatch(actionName, {
        events: makeEvents(150),
        settings,
        mapping: { ...emailMapping, external_id: { '@path': '$.properties.external_id' } },
        features
      })
      expect(getRequests.filter((r) => r.includes('any(email,'))).toHaveLength(2)
      expect(getRequests.filter((r) => r.includes('any(external_id,'))).toHaveLength(2)
      expect(getRequests).toHaveLength(4)
    })

    it('dedupes identifiers before chunking', async () => {
      mockKlaviyo()
      const events = [...makeEvents(60), ...makeEvents(60)]
      await testDestination.executeBatch(actionName, { events, settings, mapping: emailMapping, features })
      expect(getRequests).toHaveLength(1)
      expect(removedIds).toHaveLength(60)
    })

    it('follows links.next when a chunk returns more than one page', async () => {
      mockKlaviyo({ profilesPerValue: 3 })
      await testDestination.executeBatch(actionName, {
        events: makeEvents(100),
        settings,
        mapping: emailMapping,
        features
      })
      // 100 values x 3 profiles = 300 profiles = 3 pages of 100
      expect(getRequests).toHaveLength(3)
      expect(removedIds).toHaveLength(300)
    })

    it('follows exactly GET_PROFILES_MAX_PAGES_PER_CHUNK pages when there is no further page', async () => {
      mockKlaviyo({ profilesPerValue: 10 })
      await testDestination.executeBatch(actionName, {
        events: makeEvents(100),
        settings,
        mapping: emailMapping,
        features
      })
      // 100 values x 10 profiles = 1000 profiles = 10 pages of 100, and the last page has no next link
      expect(getRequests).toHaveLength(10)
      expect(removedIds).toHaveLength(1000)
    })

    it('fails the batch instead of removing a partial set when the page cap is reached', async () => {
      mockKlaviyo({ profilesPerValue: 100 })
      const statsClient = { incr: jest.fn(), histogram: jest.fn() }
      await expect(
        testDestination.executeBatch(actionName, {
          events: makeEvents(100),
          settings,
          mapping: emailMapping,
          features,
          statsContext: { statsClient, tags: [] } as any
        })
      ).rejects.toThrow('not removing a partial set')
      expect(getRequests).toHaveLength(10)
      // nothing was removed, and no event is reported as delivered
      expect(removedIds).toHaveLength(0)
    })

    it('runs chunk lookups concurrently, at most GET_PROFILES_CONCURRENCY at a time', async () => {
      mockKlaviyo({ delayMs: 30 })
      const response = await testDestination.executeBatch(actionName, {
        events: makeEvents(1000),
        settings,
        mapping: emailMapping,
        features
      })
      expect(response.every((r: any) => r.status === 200)).toBe(true)
      expect(getRequests).toHaveLength(10)
      expect(maxInFlightGets).toBeGreaterThan(1)
      expect(maxInFlightGets).toBeLessThanOrEqual(GET_PROFILES_CONCURRENCY)
      expect(new Set(removedIds).size).toBe(1000)
    })

    it('splits list removal into requests of at most 1000 profile ids', async () => {
      mockKlaviyo({ profilesPerValue: 3 })
      await testDestination.executeBatch(actionName, {
        events: makeEvents(500),
        settings,
        mapping: emailMapping,
        features
      })
      expect(removedIds).toHaveLength(1500)
      expect(removeRequestSizes).toEqual([1000, 500])
    })

    it('removes nothing and reports the error for every event when one chunk lookup is rate limited', async () => {
      // 250 emails = 3 chunks; only the chunk containing user220 is throttled
      mockKlaviyo({ rateLimitLookupsContaining: 'user220@example.com' })
      const response = await testDestination.executeBatch(actionName, {
        events: makeEvents(250),
        settings,
        mapping: emailMapping,
        features
      })
      expect(response.every((r: any) => r.status === 429)).toBe(true)
      expect(removedIds).toHaveLength(0)
    })

    it('reports an error for the whole batch when a later removal request fails after earlier ones succeeded', async () => {
      // 500 emails x 3 profiles = 1500 ids -> remove requests of 1000 and 500; the second one fails
      mockKlaviyo({ profilesPerValue: 3, failRemoveRequestNumber: 2 })
      const response = await testDestination.executeBatch(actionName, {
        events: makeEvents(500),
        settings,
        mapping: emailMapping,
        features
      })
      expect(removeRequestSizes).toEqual([1000, 500])
      // the first 1000 were removed already; removal is idempotent, so the retry of the batch is safe
      expect(removedIds).toHaveLength(1000)
      expect(response.every((r: any) => r.status === 500)).toBe(true)
    })

    it('reports per-event errors when Klaviyo rejects a lookup', async () => {
      nock(API_URL)
        .get(/\/profiles\/.*/)
        .reply(400, { errors: [{ detail: 'bad request' }] })
      const response = await testDestination.executeBatch(actionName, {
        events: makeEvents(5),
        settings,
        mapping: emailMapping,
        features
      })
      expect(response.every((r: any) => r.status === 400)).toBe(true)
    })
  })
})
