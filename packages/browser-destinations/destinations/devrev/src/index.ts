import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import revUserEnrichment from './revUserEnrichment'

export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Devrev',
  mode: 'device',
  initialize: async () => {
    return {}
  },
  actions: {
    revUserEnrichment
  }
}

export default browserDestination(destination)
