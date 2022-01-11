import type { DestinationDefinition, RefreshAccessTokenResult } from '@segment/actions-core'
import type { Settings } from './generated-types'
import lead from './lead'
interface SalesforceRefreshAccessTokenResult extends RefreshAccessTokenResult {
  instance_url: string
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
          'Base Url of the request. For local testing only. refreshAccessToken will eventually be able to fetch this value via Oauth',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<SalesforceRefreshAccessTokenResult>(
        'https://login.salesforce.com/services/oauth2/token',
        {
          method: 'POST',
          body: new URLSearchParams({
            refresh_token: auth.refreshToken,
            client_id: auth.clientId,
            client_secret: auth.clientSecret,
            grant_type: 'refresh_token'
          })
        }
      )
      return { accessToken: res.data.accessToken }
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
    lead
  }
}

export default destination
