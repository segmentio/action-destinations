import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { createHmac } from 'crypto'

import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Webhook',
  slug: 'actions-webhook',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      sharedSecret: {
        type: 'string',
        label: 'Shared Secret',
        description:
          'If set, Segment will sign requests with an HMAC in the "X-Signature" request header. The HMAC is a hex-encoded SHA1 hash generated using this shared secret and the request body.'
      }
    }
  },
  extendRequest: ({ settings, payload }) => {
    if (settings.sharedSecret && payload?.data) {
      const digest = createHmac('sha1', settings.sharedSecret)
        .update(JSON.stringify(payload.data), 'utf8')
        .digest('hex')
      return { headers: { 'X-Signature': digest } }
    }
    return {}
  },
  actions: {
    send
  }
}

export default destination
