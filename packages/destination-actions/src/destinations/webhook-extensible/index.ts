import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { createHmac } from 'crypto'
import { RefreshTokenResponse } from './types'

import send from './send'

const destination: DestinationDefinition<Settings> = {
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
      },
      client_id: {
        label: 'Client ID',
        description: 'Your client ID.',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'Client Secret',
        description: 'Your client secret.',
        type: 'password',
        required: true
      },
      authenticationUrl: {
        label: 'Authentication URL',
        description: 'The URL to authenticate the client.',
        type: 'string',
        required: true
      },
      refreshTokenUrl: {
        label: 'Refresh Token URL',
        description: 'The URL to refresh the access token.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const res = await request<RefreshTokenResponse>(settings.authenticationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(settings.client_id + ':' + settings.client_secret).toString('base64')}`
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
      const res = await request<RefreshTokenResponse>(settings.refreshTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(settings.client_id + ':' + settings.client_secret).toString('base64')}`
        },
        body: '{"grant_type":"client_credentials"}'
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest: ({ settings, payload, auth }) => {
    const payloadData = payload.length ? payload[0]['data'] : payload['data']
    if (settings.sharedSecret && payloadData) {
      const digest = createHmac('sha1', settings.sharedSecret).update(JSON.stringify(payloadData), 'utf8').digest('hex')
      return {
        headers: {
          'X-Signature': digest,
          authorization: `Bearer ${auth?.accessToken}`
        }
      }
    }
    return {}
  },
  actions: {
    send
  }
}

export default destination
