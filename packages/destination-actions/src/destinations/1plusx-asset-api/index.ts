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
      // update to client_id. Was "client_name"
      client_id: {
        label: 'Client ID',
        description: 'Your 1plusX Client ID. Please refer to your 1PlusX representative to obtain it.',
        type: 'string',
        required: true
      },
      // update to key_id. Was "client_id"
      key_id: {
        label: 'Key ID',
        description: 'Your 1plusX Key ID. Available in 1plusX UI in the "API Keys" section.',
        type: 'password',
        required: true
      },
      client_secret: {
        label: 'Secret',
        description: 'Your 1plusX Secret. Available in 1plusX UI in the "API Keys" section.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const res = await request<RefreshTokenResponse>('https://us.1plusx.io/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(settings.key_id + ':' + settings.client_secret).toString('base64')}`
        },
        body: '{"grant_type":"client_credentials"}'
      })
      if (res.status == 200) {
        return { accessToken: res.data.access_token }
      } else {
        throw new Error(res.status + res.statusText)
      }
    },
    refreshAccessToken: async (request, { settings }) => {
      // Refresh access token using client_id and client_secret provided in the Settings
      const res = await request<RefreshTokenResponse>('https://us.1plusx.io/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(settings.key_id + ':' + settings.client_secret).toString('base64')}`
        },
        body: '{"grant_type":"client_credentials"}'
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
    sendAssetData
  }
}

export default destination
