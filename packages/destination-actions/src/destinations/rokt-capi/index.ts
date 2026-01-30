import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Rokt Conversions API',
  slug: 'actions-rokt-capi',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Rokt CAPI API Key. Contact your Rokt representative to obtain this value.',
        type: 'password',
        required: true
      },
      apiSecret: {
        label: 'API Secret',
        description: 'Your Rokt CAPI API Secret. Contact your Rokt representative to obtain this value.',
        type: 'password',
        required: true
      }
    }
  },
  extendRequest: ({ settings }) => {
    const { apiKey, apiSecret } = settings

    return {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
      }
    }
  },
  actions: {
    send
  }
}

export default destination
