import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'
import { presets } from './presets'

const destination: DestinationDefinition<Settings> = {
  name: 'Appcues (Actions)',
  slug: 'actions-appcues',
  mode: 'cloud',
  description: 'Send events to Appcues.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Appcues API key.',
        type: 'password',
        required: true
      },
      apiSecret: {
        label: 'API Secret',
        description: 'Your Appcues API secret.',
        type: 'password',
        required: true
      },
      accountId: {
        label: 'Account ID',
        description: 'Your Appcues account ID.',
        type: 'number',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Select the region for your Appcues account.',
        type: 'string',
        required: true,
        choices: [
          { label: 'US', value: 'US' },
          { label: 'EU', value: 'EU' }
        ],
        default: 'US'
      }
    }
  },
  extendRequest({ settings }) {
    const { apiKey, apiSecret } = settings
    return {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    }
  },
  presets,
  actions: {
    send
  }
}

export default destination
