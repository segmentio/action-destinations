import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

import postToChannel from './postToChannel'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Mobile Test',
  slug: 'actions-mobile-test',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
  },

  initialize: async ({ settings }, deps) => {
    console.log(settings)
    await deps.loadScript('<path_to_partner_script>')
    // initialize client code here
  },

  actions: {
    postToChannel
  }
}

export default browserDestination(destination)
