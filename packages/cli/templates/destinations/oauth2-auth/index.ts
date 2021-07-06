import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const destination: DestinationDefinition<Settings> = {
  name: '{{name}}',
  authentication: {
    scheme: 'oauth2',
    fields: {},
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's credentials here
    },
    refreshAccessToken: async (request, { settings }, oauthConfig) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request('https://www.example.com/oauth/refresh', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: settings.refreshToken,
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.body.access_token }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        authorization: `Bearer ${settings.accessToken}`
      }
    }
  },
  actions: {}
}

export default destination
