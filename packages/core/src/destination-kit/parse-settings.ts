import { OAuth2ClientCredentials, RefreshAccessTokenResult } from '.'
import { JSONObject, JSONValue } from '../json-object'

interface OAuthSettings {
  access_token: string
  refresh_token: string
  clientId: string
  clientSecret: string
}

export interface AuthTokens {
  /** OAuth2 access token */
  accessToken: string
  /** OAuth2 refresh token */
  refreshToken: string
}

/**
 * Returns the Auth data needed for OAuth.
 * TODO: this will change to include all authentication fields
 * @param settings
 * @returns
 */
export function getAuthData(settings: JSONObject): AuthTokens {
  const oauthData = getOAuth2Data(settings)
  return { accessToken: oauthData.accessToken, refreshToken: oauthData.refreshToken }
}

/**
 * Get the OAuth tokens and Client data needed to trigger a refresh token flow
 * @param settings
 * @returns
 */
export function getOAuth2Data(settings: JSONObject): OAuth2ClientCredentials {
  const { oauth } = settings
  return {
    accessToken: (oauth as unknown as OAuthSettings)?.access_token,
    refreshToken: (oauth as unknown as OAuthSettings)?.refresh_token,
    clientId: (oauth as unknown as OAuthSettings)?.clientId,
    clientSecret: (oauth as unknown as OAuthSettings)?.clientSecret
  } as OAuth2ClientCredentials
}

/**
 * Updates settings.oauth by adding the new accessToken and refreshToken values
 * @param settings
 * @param oauthData
 * @returns
 */
export function updateOAuthSettings(settings: JSONObject, oauthData: RefreshAccessTokenResult): JSONObject {
  const { oauth, ...otherSettings } = settings
  if (oauth) {
    const newOauth = oauth as unknown as OAuthSettings
    newOauth.access_token = oauthData.accessToken
    if (oauthData.refreshToken) {
      newOauth.refresh_token = oauthData.refreshToken
    }
    otherSettings['oauth'] = newOauth as unknown as JSONValue
  }
  return otherSettings
}
