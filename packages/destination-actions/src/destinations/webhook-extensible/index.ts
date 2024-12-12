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
      let res
      const { clientId, clientSecret } = auth
      const { oauth } = settings.dynamicAuthSettings

      if (oauth.type === 'authCode') {
        res = await request<RefreshTokenResponse>(oauth.refreshTokenServerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(clientId + ':' + clientSecret).toString('base64')}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: auth.refreshToken ?? oauth.access.refresh_token,
            scope: oauth.scopes,
            client_id: clientId,
            client_secret: clientSecret
          })
        })
        return {
          accessToken: res.data.access_token,
          refreshToken: res.data.refresh_token
        }
      } else {
        res = await request<RefreshTokenResponse>(oauth.refreshTokenServerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(clientId + ':' + clientSecret).toString('base64')}`
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            scope: oauth.scopes
          })
        })
        return { accessToken: res.data.access_token }
      }
    }
  },
  extendRequest: ({ settings, auth }) => {
    const { dynamicAuthSettings } = settings
    const accessToken = auth?.accessToken ?? dynamicAuthSettings?.oauth?.access?.access_token
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
