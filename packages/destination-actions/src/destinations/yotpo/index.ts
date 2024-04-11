import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendData from './sendData'

interface AccessTokenResponse {
  access_token: string
  token_type: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Yotpo',
  slug: 'yotpo-actions',
  mode: 'cloud',
  description: 'Send data to Yotpo',

  authentication: {
    scheme: 'oauth-managed',
    fields: {
      store_id: {
        label: 'Store ID',
        description: 'The store ID for your Yotpo account',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, data) => {
      return request(`https://developers.yotpo.com/v2/${data.settings.store_id}/info`, {
        method: 'get'
      })
    },
    refreshAccessToken: async (request, data) => {
      const promise = await request<AccessTokenResponse>(`https://developers.yotpo.com/v2/oauth/token`, {
        method: 'post',
        json: {
          client_id: data.auth.clientId,
          client_secret: data.auth.clientSecret,
          grant_type: 'authorization_code'
        }
      })
      return {
        accessToken: promise.data.access_token
      }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        'X-Yotpo-Token': `${auth?.accessToken}`
      }
    }
  },

  actions: {
    sendData
  }
}

export default destination
