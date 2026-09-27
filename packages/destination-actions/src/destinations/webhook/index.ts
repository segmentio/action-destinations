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
        type: 'password',
        label: 'Shared Secret',
        description:
          'If set, Segment will sign requests with an HMAC in the "X-Signature" request header. The HMAC is a hex-encoded SHA1 hash generated using this shared secret and the request body.'
      }
    }
  },
  extendRequest: ({ settings, payload }) => {
    // In batch mode `payload` is an array and the request body is the array of
    // each event's `data`; in single mode it's a single event and the body is
    // its `data`. Sign the exact body that will be sent so the X-Signature HMAC
    // matches whether or not batching is enabled.
    const signedBody = Array.isArray(payload) ? payload.map((p) => p['data']) : payload['data']
    const hasBody = Array.isArray(payload) ? payload.length > 0 : Boolean(signedBody)
    if (settings.sharedSecret && hasBody) {
      const digest = createHmac('sha1', settings.sharedSecret).update(JSON.stringify(signedBody), 'utf8').digest('hex')
      return { headers: { 'X-Signature': digest } }
    }
    return {}
  },
  actions: {
    send
  }
}

export default destination
