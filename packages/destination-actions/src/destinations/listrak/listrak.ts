import { RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from './generated-types'

let accessToken: string = ''

export const clearToken = () => {
  accessToken = '';
}

export const setToken = (value: string) => {
  accessToken = value;
}

export const getAuthToken = async (request: RequestClient, settings: Settings): Promise<string> => {

  if(accessToken) {
    return accessToken;
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
