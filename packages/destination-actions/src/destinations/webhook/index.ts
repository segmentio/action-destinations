import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { createHmac } from 'crypto'

// TEMPORARY bug-bash (Row 62, scratch): remove all web/cloud actions to verify
// the bot's inferPlatforms flips platforms.browser/server to false. Never merge.

const destination: DestinationDefinition<Settings> = {
  name: 'Webhook',
  slug: 'actions-webhook',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
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
    const payloadData = payload.length ? payload[0]['data'] : payload['data']
    if (settings.sharedSecret && payloadData) {
      const digest = createHmac('sha1', settings.sharedSecret).update(JSON.stringify(payloadData), 'utf8').digest('hex')
      return { headers: { 'X-Signature': digest } }
    }
    return {}
  },
  actions: {}
}

export default destination
