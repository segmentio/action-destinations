import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendData from './sendData'

interface AccessTokenResponse {
  access_token: string
  token_type: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Yotpo',
  slug: 'yotpo',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
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
          grant_type: 'authorization_code',
          code: 'code', // TODO - this is the generated code from the authorization step, how can we get it or it would be added automatically by Segment?
          redirect_uri: 'https://app.segment.com/'
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

  onDelete: async () => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    sendData
  }
}

export default destination
