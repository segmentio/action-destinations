import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import type { DecoratedResponse } from '@segment/actions-core'
import Destination from '../index'

import { defaultMapiBaseUrl, resetAuthCache } from '../cloudUtil'

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

function trackPurchase(orderId: string, settings: { authKey: string; authSecret: string }) {
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
