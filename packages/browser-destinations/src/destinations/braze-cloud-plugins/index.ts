import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import debouncePlugin from './debouncePlugin'

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
    debouncePlugin
  }
}

export default browserDestination(destination)
