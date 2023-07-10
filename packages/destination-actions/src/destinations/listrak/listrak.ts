import { HTTPError, RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from './generated-types'

let accessToken = ''

export function clearToken() {
  accessToken = ''
}

export function setToken(value: string) {
  accessToken = value
}

export async function getAuthToken(request: RequestClient, settings: Settings): Promise<string> {
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

interface RequestBody {
  method: string
  json?: object
}

export async function makePostRequest(
  request: RequestClient,
  settings: Settings,
  url: string,
  jsonBody: object
): Promise<void> {
  await MakeRequest(request, settings, url, {
    method: 'POST',
    json: jsonBody
  })
}

export async function makeGetRequest<T>(request: RequestClient, settings: Settings, url: string): Promise<T> {
  return await MakeRequest<T>(request, settings, url, {
    method: 'GET'
  })
}

async function MakeRequest<T>(request: RequestClient, settings: Settings, url: string, requestBody: RequestBody) {
  if (!accessToken) {
    await getAuthToken(request, settings)
  }

  try {
    return (await request(url, addAuthorization(requestBody))) as T
  } catch (err) {
    if (isResponseUnauthorized(err)) {
      clearToken()
      await getAuthToken(request, settings)
      return (await request(url, addAuthorization(requestBody))) as T
    }
    throw err
  }
}

function addAuthorization(requestBody: object) {
  return Object.assign(requestBody, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

function isResponseUnauthorized(error: any) {
  const httpError = error as HTTPError
  return httpError.response && httpError.response.status && httpError.response.status === 401
}
