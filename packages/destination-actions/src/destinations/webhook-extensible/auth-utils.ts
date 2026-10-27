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

// Only these destinations for a refreshRequest param are supported. Anything else
// (notably '__proto__', 'constructor', 'prototype') is rejected to prevent prototype pollution,
// since sendIn/key come straight from customer-controlled destination settings.
const ALLOWED_SEND_IN = ['header', 'body', 'query']

const getRequestData = (oauth: any, auth: any) => {
  const customParamsObj: Record<string, Record<string, unknown>> = Object.create(null)
  if (Array.isArray(oauth?.customParams?.refreshRequest) && oauth.customParams.refreshRequest.length > 0) {
    for (const { key, value, sendIn } of oauth.customParams.refreshRequest) {
      if (typeof key !== 'string' || typeof sendIn !== 'string' || !ALLOWED_SEND_IN.includes(sendIn)) {
        continue
      }
      if (!Object.prototype.hasOwnProperty.call(customParamsObj, sendIn)) {
        customParamsObj[sendIn] = Object.create(null)
      }
      customParamsObj[sendIn][key] = value
    }
  }
  const customHeaders = customParamsObj.header ?? {}
  const customBody = customParamsObj.body ?? {}
  const customQuery = customParamsObj.query ?? {}
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
      scope: oauth.scopes,
      client_id: clientId,
      client_secret: clientSecret,
      ...customBody
    }
  } else {
    bodyParams = {
      grant_type: 'client_credentials',
      scope: oauth.scopes,
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
