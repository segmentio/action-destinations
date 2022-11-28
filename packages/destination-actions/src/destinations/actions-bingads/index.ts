import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import offlineConversions from './offlineConversions'

interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Bingads',
  slug: 'actions-bingads',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      client_id: {
        label: 'Client ID',
        description:
          'ID of your Microsoft Bing Ads Account. This should be a 36-characters alpha-numeric string. **Required**',
        type: 'string'
      },
      client_secret: {
        label: 'Client Secret',
        description: 'Client Secret from your Azure Portal account registered app. **Required**',
        type: 'string'
      },
      redirect_uri: {
        label: 'Redirect URI',
        description:
          'Redirect URI for user consent (https://login.microsoftonline.com/common/oauth2/nativeclient). **Required**',
        type: 'string'
      },
      scope: {
        label: 'Scope',
        description: 'Scope. **Required**',
        type: 'string'
      },
      refreshToken: {
        label: 'Refresh Token',
        description: 'Refresh Token. **Required**',
        type: 'string'
      },
      customer_account_id: {
        label: 'Customer Account ID',
        description: 'Customer Account ID. **Required**',
        type: 'string'
      },
      customer_id: {
        label: 'Customer ID',
        description: 'Customer ID. **Required**',
        type: 'string'
      },
      developer_token: {
        label: 'Developer Token',
        description: 'Developer Token. **Required**',
        type: 'string'
      }
    },
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    //   return true
    // },

    refreshAccessToken: async (request, { auth }) => {
      // refreshAccessToken: async (request, { auth, settings }) => {
      // Return a request that refreshes the access_token if the API supports it
      const baseUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
      console.log(baseUrl)
      const res = await request<RefreshTokenResponse>(`${baseUrl}`, {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token',
          scope: 'openid offline_access https://ads.microsoft.com/msads.manage',
          redirect_uri: 'https://login.microsoftonline.com/common/oauth2/nativeclient'
        })
      })
      //console.log({ accessToken: res.data.access_token })
      return { accessToken: res.data.access_token }
    }

    // extendRequest({ auth }) {
    //   return {
    //     headers: {
    //       authorization: `Bearer ${auth?.accessToken}`
    //     }
    //   }
    // }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    offlineConversions
  }
}

export default destination
