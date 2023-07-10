import { HTTPError, ModifiedResponse, RequestClient, RetryableError } from '@segment/actions-core'
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

export async function makePostRequest(request: RequestClient, settings: Settings, url: string, jsonBody: any): Promise<void> {
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

async function makeGetRequestHelper<T>(request: RequestClient, url: string): Promise<ModifiedResponse<T>> {
  return await request(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}
    

export async function makeGetRequest<T>(
  request: RequestClient,
  settings: Settings,
  url: string
): Promise<T> {
  if (!accessToken) {
    await getAuthToken(request, settings)
  }
  
  try {
    return await makeGetRequestHelper<T>(request, url) as T
  } catch (err) {
    if (isResponseUnauthorized(err)) {
      clearToken()
      await getAuthToken(request, settings)
      return await makeGetRequestHelper<T>(request, url) as T
    }
    throw err;
  }
}

function isResponseUnauthorized(error: any) {
  const httpError = error as HTTPError
  return httpError.response && httpError.response.status && httpError.response.status === 401
}
