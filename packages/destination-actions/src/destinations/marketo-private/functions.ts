import type { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { RefreshTokenResponse } from './types'
import { OAUTH_TOKEN_ENDPOINT } from './constants'

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
