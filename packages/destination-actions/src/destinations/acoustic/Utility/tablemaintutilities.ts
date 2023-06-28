import { OAuth2ClientCredentials, RefreshAccessTokenResult, RetryableError } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { AuthTokens } from '@segment/actions-core/src/destination-kit/parse-settings'

export interface accessResp {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
}
export let authCreds = {
  accessToken: '',
  clientId: '',
  clientSecret: '',
  refreshToken: '',
  refreshTokenUrl: ''
} as OAuth2ClientCredentials

// export interface RefreshAccessTokenResult {
//   /** OAuth2 access token that was recently acquired */
//   accessToken: string
//   /** Provide in case the partner API also updates the refresh token when requesting a fresh access token */
//   refreshToken?: string
// }

// AuthTokens
// accessToken: string
// /** OAuth2 refresh token */
// refreshToken: string
// /** The refresh token url used to get an updated access token. This value is configured in the developer portal. **/
// refreshTokenUrl?: string

// export interface OAuth2ClientCredentials extends AuthTokens {
//   /** Publicly exposed string that is used by the partner API to identify the application, also used to build authorization URLs that are presented to users */
//   clientId: string
//   /** Used to authenticate the identity of the application to the partner API when the application requests to access a user's account, must be kept private between the application and the API. */
//   clientSecret: string
// }

export function getAuthCreds() {
  return authCreds
}

export async function getAccessToken(
  request: RequestClient,
  settings: Settings
  //  authCreds: OAuth2ClientCredentials
) {
  authCreds = getAuthCreds()
  authCreds.accessToken = ''
  authCreds.clientId = settings.a_clientId
  authCreds.clientSecret = settings.a_clientSecret
  authCreds.refreshToken = settings.a_refreshToken
  authCreds.refreshTokenUrl = `https://api-campaign-${settings.region}-${settings.pod}.goacoustic.com/oauth/token`

  const requestAToken = await request(authCreds.refreshTokenUrl, {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: authCreds.refreshToken,
      client_id: authCreds.clientId,
      client_secret: authCreds.clientSecret,
      grant_type: 'refresh_token'
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Segment Action (Acoustic Destination) "GetAccessToken"'
    }
  })

  const ratResp = (await requestAToken.data) as accessResp
  authCreds.accessToken = ratResp.access_token

  return { accessToken: authCreds.accessToken, refreshToken: authCreds.refreshToken } as RefreshAccessTokenResult
}

export async function doPOST(
  request: RequestClient,
  settings: Settings,
  auth: AuthTokens,
  body: string,
  action: string
) {
  let resultTxt = ''
  let res = ''

  const postResults = await request(`https://api-campaign-${settings.region}-${settings.pod}.goacoustic.com/XMLAPI`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth?.accessToken}`,
      'Content-Type': 'text/xml',
      'user-agent': `Segment Action (Acoustic Destination) ${action}`,
      Connection: 'keep-alive',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept: '*/*'
    },
    body: `${body}`
  })
  res = (await postResults.data) as string

  //check for success, hard fails throw error, soft fails throw retryable error
  resultTxt = res

  if (resultTxt.toLowerCase().indexOf('<success>false</success>') > -1) {
    const rx = /<FaultString>(.*)<\/FaultString>/gm
    const r = rx.exec(resultTxt) as RegExpExecArray

    const faultMsg = r[1].toLowerCase()

    if (faultMsg.indexOf('max number of concurrent') > -1)
      throw new RetryableError(
        'Currently exceeding Max number of concurrent API authenticated requests, retrying...',
        429
      )
  }

  return resultTxt
}
