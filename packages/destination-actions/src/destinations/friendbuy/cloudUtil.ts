import { JSONObject, RequestClient, RequestOptions } from '@segment/actions-core'

import { Settings } from './generated-types'

export const friendbuyBaseHost = 'fbot-sandbox.me'
export const mapiUrl = `https://mapi.${friendbuyBaseHost}`

export async function createRequestParams(
  request: RequestClient,
  settings: Settings,
  friendbuyPayload: JSONObject
): Promise<RequestOptions> {
  const authToken = await getAuthToken(request, settings)

  return {
    method: 'POST',
    json: friendbuyPayload,
    headers: {
      Authorization: authToken
    }
  }
}

const AUTH_PADDING_MS = 10000 // 10 seconds

interface FriendbuyAuth {
  token: string
  expiresEpoch: number
}

let friendbuyAuth: FriendbuyAuth

export async function getAuthToken(request: RequestClient, settings: Settings) {
  // Refresh the token if necessary.
  if (!friendbuyAuth || Date.now() >= friendbuyAuth.expiresEpoch) {
    const r = await request(`${mapiUrl}/v1/authorization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      json: { key: settings.authKey, secret: settings.authSecret }
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
