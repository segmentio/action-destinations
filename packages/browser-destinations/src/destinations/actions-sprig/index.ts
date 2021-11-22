import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Sprig',
  slug: 'actions-sprig',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
  },

  initialize: async ({ settings, analytics }, deps) => {
    await deps.loadScript('<path_to_partner_script>')
    // initialize client code here
    console.log(settings, analytics) // temp
  },

  actions: {}
}

export default browserDestination(destination)
