import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import type { DecoratedResponse, RequestClient } from '@segment/actions-core'
import Destination from '../index'

import {
  AUTH_CACHE_MAX_ENTRIES,
  AUTH_CACHE_MAX_ENTRY_LENGTH,
  authCacheSize,
  defaultMapiBaseUrl,
  getAuthToken,
  resetAuthCache
} from '../cloudUtil'

const testDestination = createTestIntegration(Destination)

const merchantA = { authKey: 'aaaaaaaa-0000-4000-8000-000000000001', authSecret: 'secret-a' }
const merchantB = { authKey: 'bbbbbbbb-0000-4000-8000-000000000002', authSecret: 'secret-b' }

const tokenA = 'token-for-merchant-a'
const tokenB = 'token-for-merchant-b'

const expires = () => new Date(Date.now() + 300 * 1000).toISOString()

// One token per credential, so a token served to the wrong merchant is obvious.
function nockAuthFor(baseUrl: string, authKey: string, token: string) {
  nock(baseUrl)
    .post('/v1/authorization', (body: { key?: string }) => body.key === authKey)
    .reply(200, { token, expires: expires() })
}

function nockPurchase(baseUrl: string, times = 1) {
  nock(baseUrl).post('/v1/event/purchase').times(times).reply(200, {})
}

function purchaseEvent(orderId: string) {
  return createTestEvent({
    type: 'track',
    event: 'Order Completed',
    userId: 'customer-1',
    properties: { order_id: orderId, total: 10, currency: 'USD' },
    timestamp: '2021-10-05T15:30:35Z'
  })
}

function requestsTo(responses: DecoratedResponse[], path: string) {
  return responses.filter((response) => response.request.url.includes(path))
}

/** The bearer token the purchase call actually went out with. */
function purchaseAuthToken(responses: DecoratedResponse[]) {
  const [purchase] = requestsTo(responses, '/v1/event/purchase')
  if (!purchase) {
    throw new Error('no purchase request was made')
  }
  const headers = purchase.options.headers as Record<string, string> | Headers | undefined
  if (headers && typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get('authorization')
  }
  return (headers as Record<string, string>)?.Authorization
}

function authCallCount(responses: DecoratedResponse[]) {
  return requestsTo(responses, '/v1/authorization').length
}

function trackPurchase(
  orderId: string,
  settings: { authKey: string; authSecret: string }
): Promise<DecoratedResponse[]> {
  return testDestination.testAction('trackPurchase', {
    event: purchaseEvent(orderId),
    settings,
    useDefaultMappings: true
  })
}

describe('Friendbuy cloud auth token cache', () => {
  beforeEach(() => {
    resetAuthCache()
    nock.cleanAll()
  })

  test('does not reuse one merchant’s token for another merchant', async () => {
    nockAuthFor(defaultMapiBaseUrl, merchantA.authKey, tokenA)
    nockAuthFor(defaultMapiBaseUrl, merchantB.authKey, tokenB)
    nockPurchase(defaultMapiBaseUrl, 2)

    const resultA = await trackPurchase('order-a', merchantA)
    const resultB = await trackPurchase('order-b', merchantB)

    // Unkeyed, B's purchase went out under A's token and MAPI filed it to A.
    expect(purchaseAuthToken(resultA)).toBe(tokenA)
    expect(purchaseAuthToken(resultB)).toBe(tokenB)
  })

  test('reuses a cached token for the same credential', async () => {
    // Only one authorization response is stubbed; a second call would not match.
    nockAuthFor(defaultMapiBaseUrl, merchantA.authKey, tokenA)
    nockPurchase(defaultMapiBaseUrl, 2)

    const first = await trackPurchase('order-1', merchantA)
    const second = await trackPurchase('order-2', merchantA)

    expect(authCallCount(first)).toBe(1)
    expect(authCallCount(second)).toBe(0)
    expect(purchaseAuthToken(second)).toBe(tokenA)
  })

  test('keeps the cached token when only the secret is rotated', async () => {
    nockAuthFor(defaultMapiBaseUrl, merchantA.authKey, tokenA)
    nockPurchase(defaultMapiBaseUrl, 2)

    await trackPurchase('order-1', merchantA)

    // Deliberate: the issued token still resolves to the same merchant, which is
    // all this cache has to protect.
    const afterRotation = await trackPurchase('order-2', { ...merchantA, authSecret: 'secret-a-rotated' })

    expect(authCallCount(afterRotation)).toBe(0)
    expect(purchaseAuthToken(afterRotation)).toBe(tokenA)
  })

  test('keys the cache by environment as well as credential', async () => {
    const stagingBaseUrl = 'https://mapi.fbot-staging.me'
    const stagingToken = 'token-for-staging'

    nockAuthFor(defaultMapiBaseUrl, merchantA.authKey, tokenA)
    nockPurchase(defaultMapiBaseUrl)
    nockAuthFor(stagingBaseUrl, merchantA.authKey, stagingToken)
    nockPurchase(stagingBaseUrl)

    await trackPurchase('order-prod', merchantA)

    // An `environment:` prefix means a different host, which must not get the prod token.
    const staging = await trackPurchase('order-staging', {
      ...merchantA,
      authSecret: `staging:${merchantA.authSecret}`
    })

    expect(purchaseAuthToken(staging)).toBe(stagingToken)
  })

  test('throws rather than falling back when authorization returns no token', async () => {
    nock(defaultMapiBaseUrl).post('/v1/authorization').reply(200, {})
    nockPurchase(defaultMapiBaseUrl)

    await expect(trackPurchase('order-x', merchantB)).rejects.toThrowError(
      'Friendbuy MAPI authorization did not return a token.'
    )
  })
})

function stubAuthRequest(token = 'stub-token') {
  const keys: string[] = []
  const request = ((_url: string, options: { json: { key: string } }) => {
    keys.push(options.json.key)
    return Promise.resolve({ data: { token, expires: expires() } })
  }) as unknown as RequestClient
  return { request, keys }
}

describe('Friendbuy cloud auth cache bounds', () => {
  beforeEach(() => {
    resetAuthCache()
  })

  test('never grows beyond 1000 entries', async () => {
    const { request } = stubAuthRequest()

    for (let i = 0; i < AUTH_CACHE_MAX_ENTRIES + 500; i++) {
      await getAuthToken(request, defaultMapiBaseUrl, `key-${i}`, 'secret')
    }

    expect(authCacheSize()).toBeLessThanOrEqual(1000)
  })

  test('evicts the oldest entry rather than the newest', async () => {
    const { request, keys } = stubAuthRequest()

    for (let i = 0; i <= AUTH_CACHE_MAX_ENTRIES; i++) {
      await getAuthToken(request, defaultMapiBaseUrl, `key-${i}`, 'secret')
    }
    const authCalls = keys.length

    // key-0 was pushed out, so it has to re-authenticate.
    await getAuthToken(request, defaultMapiBaseUrl, 'key-0', 'secret')
    expect(keys.length).toBe(authCalls + 1)

    // The most recent entry is still cached.
    await getAuthToken(request, defaultMapiBaseUrl, `key-${AUTH_CACHE_MAX_ENTRIES}`, 'secret')
    expect(keys.length).toBe(authCalls + 1)
  })

  test('does not cache a key longer than the maximum entry length', async () => {
    const { request, keys } = stubAuthRequest()
    const longBaseUrl = `https://mapi.fbot-${'e'.repeat(AUTH_CACHE_MAX_ENTRY_LENGTH)}.me`

    const token = await getAuthToken(request, longBaseUrl, 'key-long', 'secret')
    await getAuthToken(request, longBaseUrl, 'key-long', 'secret')

    // Still authenticates and returns a usable token; it just isn't retained.
    expect(token).toBe('stub-token')
    expect(keys.length).toBe(2)
    expect(authCacheSize()).toBe(0)
  })

  test('does not cache a token longer than the maximum entry length', async () => {
    const oversizedToken = 't'.repeat(AUTH_CACHE_MAX_ENTRY_LENGTH + 1)
    const { request, keys } = stubAuthRequest(oversizedToken)

    const token = await getAuthToken(request, defaultMapiBaseUrl, merchantA.authKey, merchantA.authSecret)
    await getAuthToken(request, defaultMapiBaseUrl, merchantA.authKey, merchantA.authSecret)

    expect(token).toBe(oversizedToken)
    expect(keys.length).toBe(2)
    expect(authCacheSize()).toBe(0)
  })

  test('caches an entry at exactly the maximum length', async () => {
    const { request, keys } = stubAuthRequest()
    // Boundary is inclusive, so a key of exactly the limit is still kept.
    const authKey = 'k'.repeat(AUTH_CACHE_MAX_ENTRY_LENGTH - `${defaultMapiBaseUrl}|`.length)

    await getAuthToken(request, defaultMapiBaseUrl, authKey, 'secret')
    await getAuthToken(request, defaultMapiBaseUrl, authKey, 'secret')

    expect(keys.length).toBe(1)
    expect(authCacheSize()).toBe(1)
  })
})
