import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { API_URL, KLAVIYO_PAGINATE_GET_PROFILES_FLAG } from '../config'
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

interface MockOptions {
  // number of profiles returned per matching value (to exercise links.next)
  profilesPerValue?: number
}

function mockKlaviyo({ profilesPerValue = 1 }: MockOptions = {}) {
  removedIds = []
  removeRequestSizes = []
  getRequests = []
  nock(API_URL)
    .persist()
    .get(/\/profiles\/.*/)
    .reply(function (uri) {
      getRequests.push(decodeURIComponent(uri))
      const url = new URL(uri, 'https://a.klaviyo.com')
      const filter = url.searchParams.get('filter') ?? ''
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
    .reply(202, (_uri, body: any) => {
      removeRequestSizes.push(body.data.length)
      removedIds.push(...body.data.map((p: any) => p.id))
      return {}
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

    it('stops following links.next at the page cap', async () => {
      mockKlaviyo({ profilesPerValue: 100 })
      await testDestination.executeBatch(actionName, {
        events: makeEvents(100),
        settings,
        mapping: emailMapping,
        features
      })
      expect(getRequests).toHaveLength(10)
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
