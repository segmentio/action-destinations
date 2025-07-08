import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { initializePixel } from './init-script'
import { CJ } from './types'

import sitePage from './sitePage'

import order from './order'

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
    },
    actionTrackerId: {
      label: 'Action Tracker ID',
      description: 'Used with the "Order" Action only. Can be overridden at the Action level. This is a static value provided by CJ. Each account may have multiple actions and each will be referenced by a different actionTrackerId value.',
      type: 'string'
    }
  },
  initialize: async ({ settings }, deps) => {
    initializePixel(settings)
    await deps.resolveWhen(() => window.cj != null, 100)
    return window.cj
  },

  actions: {
    sitePage,
    order
  }
}

export default browserDestination(destination)
