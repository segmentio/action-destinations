import { ErrorCodes, OAuth2ClientCredentials, InvalidAuthenticationError, RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { SettingsWithOauth, AmazonRefreshTokenError, RefreshTokenResponse } from './types'
import { AUTHORIZATION_URL } from './constants'  

export function extractNumberAndSubstituteWithStringValue(responseString: string, regex: RegExp, substituteWith: string) {
  const resString = responseString.replace(regex, substituteWith)
  return JSON.parse(resString)
}

// Use the refresh token to get a new access token.
// Refresh tokens, Client_id and secret are long-lived and belong to the DMP.
// Given the short expiration time of access tokens, we need to refresh them periodically.
export const getAuthToken = async (request: RequestClient, settings: Settings, auth: OAuth2ClientCredentials): Promise<string> => {
  const endpoint = AUTHORIZATION_URL[`${settings.region}`]
  try {
    const { data } = await request<RefreshTokenResponse>(`${endpoint}/auth/o2/token`, {
      method: 'POST',
      body: new URLSearchParams({
        refresh_token: auth.refreshToken,
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
        grant_type: 'refresh_token'
      }),
      headers: {
        // Amazon ads refresh token API throws error with authorization header so explicity overriding Authorization header here.
        authorization: ''
      },
      timeout: 15000
    })
    return data.access_token
  } catch (e: unknown) {
    const error = e as AmazonRefreshTokenError
    if (error.response?.data?.error === 'invalid_grant') {
      throw new InvalidAuthenticationError(
        `Invalid Authentication: Your refresh token is invalid or expired. Please re-authenticate to fetch a new refresh token.`,
        ErrorCodes.REFRESH_TOKEN_EXPIRED
      )
    }

    throw new InvalidAuthenticationError(
      `Failed to fetch a new access token. Reason: ${error.response?.data?.error}`,
      ErrorCodes.OAUTH_REFRESH_FAILED
    )
  }
}

export const getAuthSettings = (settings: SettingsWithOauth): OAuth2ClientCredentials => {
  
  const { 
    refresh_token: refreshToken, 
    access_token: accessToken, 
    client_id: clientId, 
    client_secret: clientSecret 
  } = settings.oauth || {}

  const oauth2ClientCredentials: OAuth2ClientCredentials = {
    refreshToken,
    accessToken,
    clientId,
    clientSecret
  }

  return oauth2ClientCredentials
}
