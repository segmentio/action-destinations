import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'

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

  actions: {
    send
  }
}

export default destination
