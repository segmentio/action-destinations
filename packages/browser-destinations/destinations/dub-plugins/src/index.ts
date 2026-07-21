import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import dubPlugin from './dubPlugin'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Dub Browser Plugins',
  description: 'Enriches all Segment payloads with dub_id cookie value',
  mode: 'device',
  initialize: async () => {
    return {}
  },
  settings: {},
  actions: {
    dubPlugin
  }
}

export default browserDestination(destination)
