import { JSONObject, RequestClient, RequestOptions, RetryableError } from '@segment/actions-core'

import { Settings } from './generated-types'

export const defaultMapiBaseUrl = `https://mapi.fbot.me`

export function getMapiBaseUrl(authSecret: string) {
  const colonPos = authSecret.indexOf(':')
  if (colonPos <= 0) {
    return [authSecret, defaultMapiBaseUrl]
  } else {
    const realAuthSecret = authSecret.substring(colonPos + 1)
    const environment = authSecret.substring(0, colonPos)
    const mapiBaseUrl = `https://mapi.fbot-${environment}.me`
    return [realAuthSecret, mapiBaseUrl]
  }
}

export async function createMapiRequest(
  path: string,
  request: RequestClient,
  settings: Settings,
  friendbuyPayload: JSONObject
): Promise<[string, RequestOptions]> {
  const [authSecret, mapiBaseUrl] = getMapiBaseUrl(settings.authSecret)
  const authToken = await getAuthToken(request, mapiBaseUrl, settings.authKey, authSecret)

  return [
    `${mapiBaseUrl}/${path}`,
    {
      method: 'POST',
      json: friendbuyPayload,
      headers: {
        Authorization: authToken
      }
    }
  ]
}

const AUTH_PADDING_MS = 10000 // 10 seconds

// Workers are long-lived, so the cache needs a ceiling.
export const AUTH_CACHE_MAX_ENTRIES = 1000

// The `environment:` prefix and the token are both external input, so bound the
// per-entry size too; an oversized entry still authenticates, it just isn't kept.
export const AUTH_CACHE_MAX_ENTRY_LENGTH = 256

interface FriendbuyAuth {
  token: string
  expiresEpoch: number
}

// Keyed per credential: a shared slot sends one merchant's token with another's events.
const authCache = new Map<string, FriendbuyAuth>()

// Base URL is in the key because an `environment:` prefix repoints the same key at another host.
function authCacheKey(mapiBaseUrl: string, authKey: string) {
  return `${mapiBaseUrl}|${authKey}`
}

function pruneAuthCache() {
  const now = Date.now()
  for (const [key, auth] of authCache) {
    if (now >= auth.expiresEpoch) {
      authCache.delete(key)
    }
  }
  // Map iterates in insertion order, so the first key is the oldest.
  while (authCache.size >= AUTH_CACHE_MAX_ENTRIES) {
    const oldest = authCache.keys().next()
    if (oldest.done) {
      break
    }
    authCache.delete(oldest.value)
  }
}

function isCacheable(cacheKey: string, token: string) {
  return cacheKey.length <= AUTH_CACHE_MAX_ENTRY_LENGTH && token.length <= AUTH_CACHE_MAX_ENTRY_LENGTH
}

/** Clears the cache; module state outlives a single test. */
export function resetAuthCache() {
  authCache.clear()
}

/** Exposed so the cache ceiling can be asserted directly. */
export function authCacheSize() {
  return authCache.size
}

export async function getAuthToken(request: RequestClient, mapiBaseUrl: string, authKey: string, authSecret: string) {
  const cacheKey = authCacheKey(mapiBaseUrl, authKey)

  const cached = authCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresEpoch) {
    return cached.token
  }

  const r = await request(`${mapiBaseUrl}/v1/authorization`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    json: { key: authKey, secret: authSecret }
  })

  const data = r.data as { token?: string; expires?: string } | undefined
  if (!data?.token || !data.expires) {
    // A rejected credential already threw an HTTPError above, so a 2xx without a
    // token is service-side, not the merchant's to fix.
    throw new RetryableError('Friendbuy MAPI authorization did not return a token.')
  }

  if (isCacheable(cacheKey, data.token)) {
    if (authCache.size >= AUTH_CACHE_MAX_ENTRIES) {
      pruneAuthCache()
    }

    // A malformed `expires` gives NaN, which compares false above and forces re-auth.
    authCache.set(cacheKey, {
      token: data.token,
      expiresEpoch: Date.parse(data.expires) - AUTH_PADDING_MS
    })
  }

  return data.token
}
