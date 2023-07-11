import { HTTPError, RequestClient, RequestOptions, RetryableError } from '@segment/actions-core'
import type { Settings } from './generated-types'

let accessToken = ''

export function clearToken() {
  accessToken = ''
}

export function setToken(value: string) {
  accessToken = value
}

export async function fetchNewAccessToken(request: RequestClient, settings: Settings): Promise<void> {
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
  } catch {
    throw new RetryableError(`Error while getting an access token`)
  }
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
    method: 'GET',
    skipResponseCloning: true
  })
}

async function MakeRequest<T>(request: RequestClient, settings: Settings, url: string, requestOptions: RequestOptions) {
  try {
    if (!accessToken) {
      await fetchNewAccessToken(request, settings)
    }

    return (await request(url, addAuthorizationHeader(requestOptions))) as T
  } catch (err) {
    if (isResponseUnauthorized(err as HTTPError)) {
      await fetchNewAccessToken(request, settings)
      return (await request(url, addAuthorizationHeader(requestOptions))) as T
    }
    throw err
  }
}

function addAuthorizationHeader(requestBody: object) {
  return Object.assign(requestBody, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

function isResponseUnauthorized(httpError: HTTPError) {
  return httpError.response && httpError.response.status && httpError.response.status === 401
}
