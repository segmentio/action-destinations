import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { loadScript } from '../../runtime/load-script'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: '{{name}}',

  authentication: {
    fields: {
      // Add any Segment destination settings required here
    }
  },
  actions: {},
  initialize: async ({ settings, analytics }) => {
    await loadScript('<path_to_partner_script>')
    // initialize client code here
  }
}

export default browserDestination(destination)
