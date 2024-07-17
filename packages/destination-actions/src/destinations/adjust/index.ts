import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendEvent from './sendEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Adjust (Actions)',
  slug: 'actions-adjust',
  mode: 'cloud',

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
        description: 'The app token for your Adjust account. Can be overridden in the event mapping.',
        type: 'string',
        required: false
      },
      default_event_token: {
        label: 'Default Event Token',
        description: 'The default event token. Can be overridden in the event mapping.',
        type: 'string',
        required: false
      },
      send_event_creation_time: {
        label: 'Send Event Creation Time',
        description: 'Send the event creation time to Adjust.',
        type: 'boolean',
        required: false,
        default: false
      }
    }
  },

  actions: {
    sendEvent
  }
}

export default destination
