import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import testEvent from './testEvent'

// SCRATCH TEST DESTINATION — bug bash browser-mode registration test, not for merge.
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Bugbash Test Registration',
  slug: 'actions-bugbash-test-registration',
  mode: 'device',

  settings: {
    // SCRATCH TEST FIELD — bug bash test: verify a real browser-mode setting comes out
    // as private:false on push (per authFieldToOption's isCloudAuth check), not the
    // hardcoded private:true seen on the required_hidden_token placeholder.
    apiKey: {
      label: 'API Key',
      description: 'A test API key setting for the bug bash private-flag test.',
      type: 'string',
      required: true
    }
  },

  initialize: async () => {
    // No real SDK to initialize — scratch/throwaway destination for a registration test.
  },

  actions: {
    testEvent
  }
}

export default browserDestination(destination)
