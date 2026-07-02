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
          'If set, Segment will sign requests with an HMAC in the signature request header. The HMAC is a hex-encoded SHA1 hash generated using this shared secret and the entire request body. See "Use X-Segment-Signature Header" for the header name used.'
      },
      useSegmentSignatureHeader: {
        type: 'boolean',
        label: 'Use X-Segment-Signature Header',
        description:
          'When enabled, the HMAC signature is sent in the "X-Segment-Signature" request header instead of "X-Signature". Only applies when a Shared Secret is set. Disabled by default.',
        default: false
      }
    }
  },
  extendRequest: ({ settings, payload }) => {
    if (!settings.sharedSecret) {
      return {}
    }
    if (settings.useSegmentSignatureHeader) {
      // New "X-Segment-Signature" behavior: sign the entire body that is actually sent
      // (the full array of event data for batches, or the single event's data otherwise),
      // so the signature covers the complete request body.
      const dataToSign = payload.length ? payload.map((p) => p['data']) : payload['data']
      if (!dataToSign) {
        return {}
      }
      const digest = createHmac('sha1', settings.sharedSecret).update(JSON.stringify(dataToSign), 'utf8').digest('hex')
      return { headers: { 'X-Segment-Signature': digest } }
    }
    // Legacy "X-Signature" behavior, preserved for backward compatibility: signs only the
    // first event's data, which does not cover the full body for batched deliveries.
    const payloadData = payload.length ? payload[0]['data'] : payload['data']
    if (!payloadData) {
      return {}
    }
    const digest = createHmac('sha1', settings.sharedSecret).update(JSON.stringify(payloadData), 'utf8').digest('hex')
    return { headers: { 'X-Signature': digest } }
  },
  actions: {
    send
  }
}

export default destination
