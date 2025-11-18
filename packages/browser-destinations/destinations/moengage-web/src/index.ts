import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import trackEvent from './trackEvent'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Moengage Web',
  slug: 'actions-moengage-web',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
  },

  initialize: async ({ settings, analytics }, deps) => {
    await deps.loadScript('https://cdn.moengage.com/webpush/moe_webSdk.min.latest.js')

    await deps.resolveWhen(() => window?.moengage != null, 100)

    return window?.moengage 
  },

  actions: {
    trackEvent
  }
}

export default browserDestination(destination)
