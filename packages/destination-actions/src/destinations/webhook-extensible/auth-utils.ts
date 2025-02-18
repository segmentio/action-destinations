import { RefreshTokenResponse } from './types'
import { RefreshAccessTokenResult } from '../../../../core/src/destination-kit'
import { RequestClient } from '../../../../core/src/create-request-client'
import { RequestOptions } from '../../../../core/src/request-client'

export const sendRefreshTokenReq = async (
  request: RequestClient,
  settings: any,
  auth: any
): Promise<RefreshAccessTokenResult> => {
  let res
  const { oauth } = settings.dynamicAuthSettings

  if (oauth.type === 'authCode') {
    res = await request<RefreshTokenResponse>(getRequestUrl(oauth), getRequestOptions(oauth, auth))
    return {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token
    }
  } else {
    res = await request<RefreshTokenResponse>(getRequestUrl(oauth), getRequestOptions(oauth, auth))
    return { accessToken: res.data.access_token }
  }
}

const getRequestUrl = (oauth: any) => {
  if (oauth?.customParams?.refreshRequest?.sendIn === 'url') {
    const customParamVal = new URLSearchParams(oauth.customParams.refreshRequest.val)
    return `${oauth.refreshTokenServerUrl}?${customParamVal ?? ''}`
  }
  return oauth.refreshTokenServerUrl
}

const getRequestOptions = (oauth: any, auth: any): RequestOptions => {
  let bodyParams = {}
  const { clientId, clientSecret } = auth
  let headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(clientId + ':' + clientSecret).toString('base64')}`
  }

  if (oauth.type === 'authCode') {
    bodyParams = {
      grant_type: 'refresh_token',
      refresh_token: auth.refreshToken ?? oauth.access.refresh_token,
      scope: oauth.scopes,
      client_id: clientId,
      client_secret: clientSecret
    }
  } else {
    bodyParams = {
      grant_type: 'client_credentials',
      scope: oauth.scopes
    }
  }

  if (oauth?.customParams?.refreshRequest?.sendIn === 'body') {
    bodyParams = {
      ...bodyParams,
      ...oauth.customParams.refreshRequest.val
    }
  } else if (oauth?.customParams?.refreshRequest?.sendIn === 'headers') {
    headers = {
      ...headers,
      ...oauth.customParams.refreshRequest.val
    }
  }

  const body = new URLSearchParams(bodyParams)

  return {
    method: 'POST',
    headers,
    body
  }
}
