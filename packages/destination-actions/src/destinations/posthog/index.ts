import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import event from './event'

import identify from './identify'

const destination: DestinationDefinition<Settings> = {
  name: 'Posthog',
  slug: 'actions-posthog',
  mode: 'cloud',
  description: 'Send events server-side to the [Posthog REST API](https://posthog.com/docs/api).',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Found in your project settings, under "Project API key"',
        type: 'password',
        required: true
      },
      project_id: {
        label: 'Project ID',
        description: 'Found in your project settings, under "Project ID"',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'Project Region',
        description: 'API Endpoint URL based on project region',
        type: 'string',
        format: 'uri',
        choices: [
          { label: 'US Cloud (https://us.i.posthog.com)', value: 'https://us.i.posthog.com' },
          { label: 'EU Cloud (https://eu.i.posthog.com)', value: 'https://eu.i.posthog.com' }
        ],
        default: 'https://us.i.posthog.com',
        required: true
      }
    }
  },
  actions: {
    event,
    identify
  }
}

export default destination
