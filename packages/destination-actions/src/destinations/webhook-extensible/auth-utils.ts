import { RefreshTokenResponse } from './types'
import { RefreshAccessTokenResult } from '../../../../core/src/destination-kit'
import { RequestClient } from '../../../../core/src/create-request-client'
import { RequestOptions } from '../../../../core/src/request-client'

export const sendRefreshTokenReq = async (
  request: RequestClient,
  settings: any,
  auth: any
): Promise<RefreshAccessTokenResult> => {
  const { oauth } = settings.dynamicAuthSettings
  if (oauth?.type === 'noAuth' || settings?.dynamicAuthSettings?.bearer) {
    return { accessToken: '' }
  }

  const { url, options } = getRequestData(oauth, auth)
  const res = await request<RefreshTokenResponse>(url, options)

  if (oauth.type === 'authCode') {
    return {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token
    }
  } else {
    return { accessToken: res.data.access_token }
  }
}

const getRequestData = (oauth: any, auth: any) => {
  let customParamsObj
  if (Array.isArray(oauth?.customParams?.refreshRequest) && oauth.customParams.refreshRequest.length > 0) {
    customParamsObj = oauth.customParams.refreshRequest.reduce((acc: any, { key, value, sendIn }: any) => {
      acc[sendIn] = acc[sendIn] || {}
      acc[sendIn][key] = value
      return acc
    }, {})
  }
  const customHeaders = customParamsObj?.header ?? {}
  const customBody = customParamsObj?.body ?? {}
  const customQuery = customParamsObj?.query ?? {}
  const url = getRequestUrl(oauth, customQuery)
  const options = getRequestOptions(oauth, auth, customHeaders, customBody)

  return {
    url,
    options
  }
}

const getRequestUrl = (oauth: any, customQuery: any) => {
  let url = oauth.refreshTokenServerUrl
  if (Object.keys(customQuery).length > 0) {
    const urlSearchParams = new URLSearchParams(customQuery)
    url = url + `?${urlSearchParams}`
  }
  return url
}

// Some token endpoints (e.g. Salesforce client credentials) reject any `scope` parameter, so only send it when set.
const getScopeParam = (oauth: any) => {
  const scopes = oauth?.scopes
  return typeof scopes === 'string' && scopes.trim() !== '' ? { scope: scopes } : {}
}

const getRequestOptions = (oauth: any, auth: any, customHeaders: object, customBody: object): RequestOptions => {
  let bodyParams = {}
  const clientId = oauth?.clientId ?? auth?.clientId
  const clientSecret = oauth?.clientSecret ?? auth?.clientSecret
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(clientId + ':' + clientSecret).toString('base64')}`,
    ...customHeaders
  }

  if (oauth.type === 'authCode') {
    bodyParams = {
      grant_type: 'refresh_token',
      refresh_token: auth.refreshToken ?? oauth.access.refresh_token,
      ...getScopeParam(oauth),
      client_id: clientId,
      client_secret: clientSecret,
      ...customBody
    }
  } else {
    bodyParams = {
      grant_type: 'client_credentials',
      ...getScopeParam(oauth),
      ...customBody
    }
  }
  const body = new URLSearchParams(bodyParams)

  return {
    method: 'POST',
    headers,
    body
  }
}
