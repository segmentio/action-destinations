import { RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from './generated-types'

export const testAuthentication: Promise<string> = async (request: RequestClient, settings: Settings) => {
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
    return json.access_token
  } catch {
    throw new RetryableError(`Error while getting an access token`)
  }
}
