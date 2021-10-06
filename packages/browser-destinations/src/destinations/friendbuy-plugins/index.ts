import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Friendbuy Plugins',
  slug: 'friendbuy-plugins',
  mode: 'device',

  initialize: async ({ _settings, _analytics }, _deps) => {
    return {}
  },

  actions: {}
}

export default browserDestination(destination)
