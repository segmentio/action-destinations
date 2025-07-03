import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { initializePixel } from './init-script'
import { CJ } from './types'


import sitePage from './sitePage'

declare global {
  interface Window {
    cj: CJ
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, CJ> = {
  name: 'Commission Junction',
  slug: 'actions-cj',
  mode: 'device',

  settings: {
    tagId: {
      label: 'Tag ID',
      description: 'Your Commission Junction Tag ID.',
      type: 'number',
      required: true
    }
  },
  initialize: async ({ settings }, deps) => {
    initializePixel(settings)  
    await deps.resolveWhen(() => window.cj != null, 100)
    return window.cj 
  },

  actions: {
    sitePage
  }
}

export default browserDestination(destination)
