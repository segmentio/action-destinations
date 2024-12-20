import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import contentstackPlugin from './contentstackPlugin'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Contentstack Browser Plugins',
  mode: 'device',

  settings: {},

  initialize: async () => {
    return {}
  },

  actions: {
    contentstackPlugin
  }
}

export default browserDestination(destination)
