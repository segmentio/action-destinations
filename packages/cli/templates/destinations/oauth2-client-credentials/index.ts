import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const destination: DestinationDefinition<Settings> = {
  name: '{{name}}',
  slug: '{{slug}}',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    oauthGrantType: 'client_credentials',
    fields: {},
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request('https://www.example.com/oauth/refresh', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'client_credentials'
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

  actions: {}
}

export default destination
