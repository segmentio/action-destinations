import { JSONObject, RequestClient, RequestOptions } from '@segment/actions-core'
import { FRIENDBUY_MAPI_VERSION } from '../versioning-info'

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

interface FriendbuyAuth {
  token: string
  expiresEpoch: number
}

let friendbuyAuth: FriendbuyAuth

export async function getAuthToken(request: RequestClient, mapiBaseUrl: string, authKey: string, authSecret: string) {
  // Refresh the token if necessary.
  if (!friendbuyAuth || Date.now() >= friendbuyAuth.expiresEpoch) {
    const r = await request(`${mapiBaseUrl}/${FRIENDBUY_MAPI_VERSION}/authorization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      json: { key: authKey, secret: authSecret }
    })

    if (r.data) {
      const data = r.data as { token: string; expires: string }
      friendbuyAuth = {
        token: data.token,
        expiresEpoch: Date.parse(data.expires) - AUTH_PADDING_MS
      }
    }
  }

  return friendbuyAuth.token
}
