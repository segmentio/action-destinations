import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncEngage from './syncEngage'

import syncRetl from './syncRetl'

import createAudience from './createAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Facebook Custom Audiences (Actions)',
  slug: 'actions-facebook-custom-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {},
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      await request('https://www.example.com/oauth/refresh', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: 'example' }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  actions: {
    syncEngage,
    syncRetl,
    createAudience
  }
}

export default destination
