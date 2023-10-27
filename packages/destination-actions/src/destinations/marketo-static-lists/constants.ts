import { RequestClient } from '@segment/actions-core/*'
import { Settings } from './generated-types'

export interface RefreshTokenResponse {
  access_token: string
}

export interface MarketoResonse {
  success: boolean
  errors: [
    {
      code: string
      message: string
    }
  ]
  result: [
    {
      name: string
      id: string
    }
  ]
}

export async function getAccessToken(request: RequestClient, settings: Settings) {
  const res = await request<RefreshTokenResponse>(`${settings.api_endpoint}/identity/oauth/token`, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'client_credentials'
    })
  })

  return res.data.access_token
}
