import { RequestClient } from '@segment/actions-core'
import { AuthTokens } from './types'


/**
 * Utility function to get a refreshed auth token
 */
export async function getAuthToken(request: RequestClient, auth: AuthTokens): Promise<string> {
  const response = await request<{ access_token: string }>(
    'https://api.amazon.com/auth/o2/token',
    {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: auth?.refreshToken,
        client_id: process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_ID || '',
        client_secret: process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_SECRET || ''
      }),
      headers: {
        // Amazon ads refresh token API throws error with authorization header so explicity overriding Authorization header here.
        authorization: ''
      },
      timeout: 2500
    }
  )

  return response.data.access_token
}