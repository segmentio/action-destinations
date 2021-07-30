import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import contact from './contact'

interface RefreshTokenResponse {
  id: string
  issued_at: number
  instance_url: string
  signature: string
  access_token: string
  scope: string
  token_type: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Salesforce',
  slug: 'actions-salesforce',

  authentication: {
    scheme: 'oauth2',
    fields: {
      // NOTE: Asking the user to define the instance url will allow the action to be used
      // on any salesforce environment (sandbox, scratch org, prod org, etc)
      instance_url: {
        label: 'Instance URL',
        description:
          'A URL indicating the instance of the user’s org. For example: https://yourInstance.salesforce.com/',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's credentials here
    },
    refreshAccessToken: async (request, { auth, settings }) => {
      // https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_refresh_token_flow.htm&type=5
      const res = await request<RefreshTokenResponse>(`${settings.instance_url}/services/oauth2/token`, {
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
    contact
  }
}

export default destination
