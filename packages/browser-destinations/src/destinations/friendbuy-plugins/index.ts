import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

import profile from './profile'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Friendbuy Plugins',
  slug: 'friendbuy-plugins',
  mode: 'device',

  initialize: async (_options, _dependencies) => {
    return {}
  },

  actions: {
    profile
  }
}

export default browserDestination(destination)
