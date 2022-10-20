import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendAssetData from './sendAssetData'

interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: '1Plusx Asset Api',
  slug: 'actions-1plusx-asset-api',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      client_id: {
        label: 'Client ID',
        description: 'Your 1plusX Client ID.',
        type: 'string',
        required: true
      }
    },

    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>('https://ui.1plusx.io/api/auth/token', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })
      return { accessToken: res.body.access_token }
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
    sendAssetData
  }
}

export default destination
