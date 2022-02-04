import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import lead from './lead'
import customObject from './customObject'

interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Salesforce (Actions)',
  slug: 'actions-salesforce',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      instanceUrl: {
        label: 'Instance URL',
        description:
          'The user specific instance URL returned by Salesforce Oauth. This setting is hidden to the user and set by Oauth Service.',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>('https://login.salesforce.com/services/oauth2/token', {
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

  actions: {
    lead,
    customObject
  }
}

export default destination
