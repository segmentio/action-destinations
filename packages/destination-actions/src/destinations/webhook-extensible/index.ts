import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { RefreshTokenResponse } from './types'

import send from './send'

type SettingsWithDynamicAuth = Settings & {
  dynamicAuthSettings: any
}
const destination: DestinationDefinition<SettingsWithDynamicAuth> = {
  name: 'Extensible Webhook',
  slug: 'actions-webhook-extensible',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      sharedSecret: {
        type: 'string',
        label: 'Shared Secret',
        description:
          'If set, Segment will sign requests with an HMAC in the "X-Signature" request header. The HMAC is a hex-encoded SHA1 hash generated using this shared secret and the request body.'
      }
    },
    refreshAccessToken: async (request, { settings, auth }) => {
      const res = await request<RefreshTokenResponse>(settings.dynamicAuthSettings.oauth.refreshTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(auth.clientId + ':' + auth.clientSecret).toString('base64')}`
        },
        body: '{"grant_type":"client_credentials"}'
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest: ({ settings }) => {
    const { dynamicAuthSettings } = settings
    const accessToken = dynamicAuthSettings?.oauth?.access?.access_token
    return {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    }
  },
  actions: {
    send
  }
}

export default destination
