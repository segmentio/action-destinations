import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import msclickId from './msclickId'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Ms Bing Capi Plugin',
  mode: 'device',
  initialize: async () => {
    // initialize client code here
    return {}
  },

  actions: {
    msclickId
  }
}

export default browserDestination(destination)
