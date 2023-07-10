import { HTTPError, ModifiedResponse, RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from './generated-types'

let accessToken = ''

export const clearToken = () => {
  accessToken = ''
}

export const setToken = (value: string) => {
  accessToken = value
}

export const getAuthToken = async (request: RequestClient, settings: Settings): Promise<string> => {
  if (accessToken) {
    return accessToken
  }

  const res = await request(`https://auth.listrak.com/OAuth2/Token`, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'client_credentials'
    }),
    headers: {
      Accept: 'text/plain', // TODO: remove this header
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  try {
    const json = await res.json()
    if (!json.access_token) {
      throw new RetryableError(`Error while getting an access token`)
    }
    setToken(json.access_token)
    return json.access_token
  } catch {
    throw new RetryableError(`Error while getting an access token`)
  }
}

export const makePostRequest = async (request: RequestClient, settings: Settings, url: string, jsonBody: any) => {
  if (!accessToken) {
    await getAuthToken(request, settings)
  }

  const makeRequest = async () =>
    request(url, {
      method: 'POST',
      json: jsonBody,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

  try {
    await makeRequest()
  } catch (err) {
    if (isResponseUnauthorized(err)) {
      clearToken()
      await getAuthToken(request, settings)
      await makeRequest()
    }
  }
}

export async function makeGetRequest<T>(
  request: RequestClient,
  settings: Settings,
  url: string
): Promise<ModifiedResponse<T>> {
  if (!accessToken) {
    await getAuthToken(request, settings)
  }

  const makeRequest: Promise<ModifiedResponse<T>> = async () =>
    await request(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

  try {
    return await makeRequest()
  } catch (err) {
    if (isResponseUnauthorized(err)) {
      clearToken()
      await getAuthToken(request, settings)
      return await makeRequest()
    }
  }
}

function isResponseUnauthorized(error: any) {
  const httpError = error as HTTPError
  return httpError.response && httpError.response.status && httpError.response.status === 401
}
