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
      endpoint: {
        label: 'Endpoint Region',
        description: 'Select the regional endpoint for your Appcues account.',
        type: 'string',
        required: true,
        choices: [
          { label: 'US', value: 'https://segment.appcues.com/v1/segment' },
          { label: 'EU', value: 'https://segment.eu.appcues.com/v1/segment' }
        ],
        default: 'https://segment.appcues.com/v1/segment'
      }
    }
  },

  actions: {
    send
  }
}

export default destination
