import {
  ErrorCodes,
  HTTPError,
  OAuth2ClientCredentials,
  InvalidAuthenticationError,
  RequestClient
} from '@segment/actions-core'
import { Settings } from './generated-types'
import { AmazonRefreshTokenError, RefreshTokenResponse } from './types'

export class AmazonAdsError extends HTTPError {
  response: Response & {
    data: {
      status: string
      message: string
    }
  }
}

export interface AudiencePayload {
  name: string
  description: string
  countryCode: string
  targetResource: {
    advertiserId: string
  }
  metadata: {
    externalAudienceId: string
    ttl?: number
    audienceFees?: {
      cpmCents: number
      currency: string
    }[]
  }
}
export interface RecordsResponseType {
  jobRequestId: string
}

export const AUTHORIZATION_URL: any = {
  'https://advertising-api.amazon.com': 'https://api.amazon.com',
  'https://advertising-api-eu.amazon.com': 'https://api.amazon.co.uk',
  'https://advertising-api-fe.amazon.com': 'https://api.amazon.co.jp'
}

export const CONSTANTS = {
  CREATE: 'CREATE',
  DELETE: 'DELETE'
}
export const CURRENCY = ['USD', 'CAD', 'JPY', 'GBP', 'EUR', 'SAR', 'AUD', 'AED', 'CNY', 'MXN', 'INR', 'SEK', 'TRY']

export const FLAG_CONSENT_REQUIRED = 'actions-amazon-amc-consent'
export const FLAG_CONSENT_SUPPRESS_ERRORS = 'actions-amazon-amc-consent-suppress-errors'

export const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
  "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
  "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
  "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
  "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
]

export const UK_EEA_COUNTRY_CODES = [
  "GB", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", 
  "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "CH"
]

export const REGEX_AUDIENCEID = /"audienceId":(\d+)/
export const REGEX_ADVERTISERID = /"advertiserId":"(\d+)"/
type AmazonAMCCredentials = { refresh_token: string; access_token: string; client_id: string; client_secret: string }

export function extractNumberAndSubstituteWithStringValue(responseString: string, regex: any, substituteWith: string) {
  const resString = responseString.replace(regex, substituteWith)
  return JSON.parse(resString)
}
type SettingsWithOauth = Settings & { oauth: AmazonAMCCredentials }
// Use the refresh token to get a new access token.
// Refresh tokens, Client_id and secret are long-lived and belong to the DMP.
// Given the short expiration time of access tokens, we need to refresh them periodically.
export const getAuthToken = async (request: RequestClient, settings: Settings, auth: OAuth2ClientCredentials) => {
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
  } catch (e: any) {
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
  return {
    refreshToken: settings.oauth?.refresh_token,
    accessToken: settings.oauth?.access_token,
    clientId: process.env.ACTIONS_AMAZON_AMC_CLIENT_ID,
    clientSecret: process.env.ACTIONS_AMAZON_AMC_CLIENT_SECRET
  } as OAuth2ClientCredentials
}
export const REGEX_EXTERNALUSERID = /^[0-9a-zA-Z-_]{1,128}$/
export const TTL_MAX_VALUE = 34300800
