import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { sendRefreshTokenReq } from './auth-utils'

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
      const res = await sendRefreshTokenReq(request, settings, auth)
      return res
    }
  },
  extendRequest: ({ settings, auth }) => {
    const { dynamicAuthSettings } = settings
    let accessToken
    let tokenPrefix = 'Bearer'
    if (dynamicAuthSettings?.bearer) {
      accessToken = dynamicAuthSettings?.bearer?.bearerToken
    } else {
      accessToken = auth?.accessToken ?? dynamicAuthSettings?.oauth?.access?.access_token
      tokenPrefix = dynamicAuthSettings?.oauth?.customParams?.tokenPrefix ?? 'Bearer'
    }
    return {
      headers: {
        authorization: `${tokenPrefix} ${accessToken}`
      }
    }
  },
  actions: {
    send
  }
}

export default destination
