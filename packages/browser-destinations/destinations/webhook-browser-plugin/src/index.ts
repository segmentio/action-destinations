import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import noop from './noop'

export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Webhook Browser Plugin',
  slug: 'webhook-browser-plugin',
  mode: 'device',

  settings: {},

  initialize: async () => {
    return {}
  },

  actions: {
    noop
  }
}

export default browserDestination(destination)
