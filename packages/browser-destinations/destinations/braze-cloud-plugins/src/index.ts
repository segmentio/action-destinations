import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import debouncePlugin from '@segment/analytics-browser-actions-braze/debounce'

export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Braze Cloud Mode (Actions)',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
  },

  initialize: async () => {
    return {}
  },

  actions: {
    // @ts-expect-error the types wont match because the Settings are very different (expected)
    debouncePlugin
  }
}

export default browserDestination(destination)
