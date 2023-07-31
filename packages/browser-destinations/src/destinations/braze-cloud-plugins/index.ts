import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import debouncePlugin from '../braze/debounce'

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
