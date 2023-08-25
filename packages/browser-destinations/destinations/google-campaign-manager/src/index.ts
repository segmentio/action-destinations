import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Google Campaign Manager',
  slug: 'actions-google-campaign-manager',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
  },

  initialize: async (_, deps) => {
    await deps.loadScript('<path_to_partner_script>')
    // initialize client code here
  },

  actions: {}
}

export default browserDestination(destination)
