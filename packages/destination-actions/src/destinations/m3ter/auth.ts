import { M3TER_AUTH_API } from './constants'
import { RequestClient } from '@segment/actions-core'

export interface AccessTokenResponse {
  token_type: string
  access_token: string
  expires_in: number
}

export default async function getAccessToken(
  request: RequestClient,
  accessKeyId: string,
  apiSecret: string
): Promise<string> {
  const res = await request<AccessTokenResponse>(`${M3TER_AUTH_API}/oauth/token`, {
    method: 'POST',
    body: '{"grant_type":"client_credentials"}',
    headers: {
      authorization: `Basic ${Buffer.from(`${accessKeyId}:${apiSecret}`).toString('base64')}`,
      'Content-Type': 'application/json'
    }
  })
  return res.data.access_token
}
