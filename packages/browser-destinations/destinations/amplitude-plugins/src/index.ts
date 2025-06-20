import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import sessionId from './sessionId'

export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Amplitude (Actions)',
  mode: 'device',
  actions: {
    sessionId
  },
  settings: {
    trackSession: {
      label: 'Track Session Start and End timestamps',
      description:
        'When enabled, the session start and end timestamps will be sent to Amplitude. This is useful for tracking user sessions.',
      required: false,
      type: 'boolean',
      default: false
    }
  },
  initialize: async () => {
    return {}
  }
}

export default browserDestination(destination)
