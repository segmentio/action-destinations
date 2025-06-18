import { IntegrationError, RequestClient } from '@segment/actions-core'
import { OAUTH_URL, SEGMENT_DMP_ID } from './constants'
import type { RefreshTokenResponse } from './types'

import type { AudienceSettings, Settings } from './generated-types'

type AuthCredentials = { refresh_token: string; access_token: string; client_id: string; client_secret: string }

export const getAuthSettings = (): AuthCredentials => {
  return {
    refresh_token: process.env.ACTIONS_DISPLAY_VIDEO_360_REFRESH_TOKEN,
    client_id: process.env.ACTIONS_DISPLAY_VIDEO_360_CLIENT_ID,
    client_secret: process.env.ACTIONS_DISPLAY_VIDEO_360_CLIENT_SECRET
  } as AuthCredentials
}

// Use the refresh token to get a new access token.
// Refresh tokens, Client_id and secret are long-lived and belong to the DMP.
// Given the short expiration time of access tokens, we need to refresh them periodically.
export const getAuthToken = async (request: RequestClient, settings: AuthCredentials) => {
  if (!settings.refresh_token) {
    throw new IntegrationError('Refresh token is missing', 'INVALID_REQUEST_DATA', 400)
  }

  const { data } = await request<RefreshTokenResponse>(OAUTH_URL, {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: settings.refresh_token,
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'refresh_token'
    })
  })

  return data.access_token
}

export const buildHeaders = (
  audienceSettings: AudienceSettings | undefined,
  settings: Settings | undefined,
  accessToken: string
) => {
  if (!audienceSettings || !accessToken || !settings) {
    throw new IntegrationError('Bad Request', 'INVALID_REQUEST_DATA', 400)
  }

  return {
    // @ts-ignore - TS doesn't know about the oauth property
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'login-customer-Id': `products/DATA_PARTNER/customers/${SEGMENT_DMP_ID}`, // this is the Segment account id
    'linked-customer-id': settings?.productLink
  }
}
