import { RequestClient } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'

export interface AccessTokenResponse {
  token_type: string
  access_token?: string
  expires_in?: number
}

export interface AccessTokenResult {
  accessToken: string
  expiresIn: number
}

export default async function getAccessToken(
  request: RequestClient,
  apiAuthEndpoint: string,
  apiClientId: string,
  apiClientSecret: string
): Promise<AccessTokenResult> {
  const requestPayload = {
    grant_type: 'client_credentials'
  }

  const requestHeaders = {
    Authorization: `Basic ${Buffer.from(`${apiClientId}:${apiClientSecret}`).toString('base64')}`,
    Accept: 'application/json'
  }

  const res = await request<AccessTokenResponse>(apiAuthEndpoint, {
    method: 'POST',
    body: new URLSearchParams(requestPayload),
    headers: requestHeaders
  })

  if (!res.data.access_token) {
    throw new IntegrationError('Authentication failed: no access token in response', 'INVALID_AUTH_RESPONSE', 401)
  }

  return {
    accessToken: res.data.access_token,
    expiresIn: res.data.expires_in ?? 3600
  }
}
