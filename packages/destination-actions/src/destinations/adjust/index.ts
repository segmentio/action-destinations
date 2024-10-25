import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendEvent from './sendEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Adjust (Actions)',
  slug: 'actions-adjust',
  mode: 'cloud',
  description: 'Send events to Adjust.',
  authentication: {
    scheme: 'custom',
    fields: {
      environment: {
        label: 'Environment',
        description: 'The environment for your Adjust account.',
        type: 'string',
        required: true,
        choices: [
          { label: 'Production', value: 'production' },
          { label: 'Sandbox', value: 'sandbox' }
        ],
        default: 'production'
      },
      default_app_token: {
        label: 'Default App Token',
        description: 'The app token for your Adjust account. This can be overridden in the event mapping.',
        type: 'string',
        required: false
      },
      default_event_token: {
        label: 'Default Event Token',
        description: 'The default event token. This can be overridden in the event mapping.',
        type: 'string',
        required: false
      }
    }
  },

  actions: {
    sendEvent
  }
}

export default destination
