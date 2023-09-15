import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import identifyRevUser from './identifyRevUser'

export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Devrev',
  slug: 'actions-devrev-web',
  mode: 'device',
  initialize: async () => {
    return {}
  },
  actions: {
    identifyRevUser
  }
}

export default browserDestination(destination)
