import type { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { RefreshTokenResponse } from './types'
import { OAUTH_TOKEN_ENDPOINT } from './constants'

// Mint a Marketo access token via the client_credentials grant.
//
// NOTE: This destination uses `scheme: 'custom'` rather than the platform-managed
// `oauth2` flow. The platform OAuth flow sources a single Segment-owned client
// id/secret per destination slug (from env vars / S3) — it cannot hold the
// per-customer credentials Marketo requires. So we mint the token inline here
// from the customer-supplied settings on each request instead.
export async function getAccessToken(request: RequestClient, settings: Settings): Promise<string> {
  const res = await request<RefreshTokenResponse>(`${settings.marketo_api_domain}${OAUTH_TOKEN_ENDPOINT}`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: settings.client_id,
      client_secret: settings.client_secret
    })
  })

  return res.data.access_token
}
