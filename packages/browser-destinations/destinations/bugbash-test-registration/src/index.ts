import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import testEvent from './testEvent'

// SCRATCH TEST DESTINATION — bug bash browser-mode registration test, not for merge.
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Bugbash Test Registration',
  slug: 'actions-bugbash-test-registration',
  mode: 'device',

  settings: {},

  initialize: async () => {
    // No real SDK to initialize — scratch/throwaway destination for a registration test.
  },

  actions: {
    testEvent
  }
}

export default browserDestination(destination)
