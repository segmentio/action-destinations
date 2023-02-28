import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postSheet from '../google-sheets/postSheet'
interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const origPerform = postSheet.performBatch || (() => {})
postSheet.performBatch = (request, obj) => {
  const { features } = obj
  if (features && features['gameday-verticalized-integrations']) {
    throw new Error('ECONNRESET: socket hang up')
  } else origPerform(request, obj)
}

const destination: DestinationDefinition<Settings> = {
  name: 'Google Sheets (dev only)',
  slug: 'actions-google-sheets-dev',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
    fields: {},
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // },
    refreshAccessToken: async (request, { auth }) => {
      const res = await request<RefreshTokenResponse>('https://www.googleapis.com/oauth2/v4/token', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    postSheet
  }
}

export default destination
