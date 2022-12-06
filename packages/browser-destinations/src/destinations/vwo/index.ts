import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import type { VWO } from './types'
import trackEvent from './trackEvent'
import { initScript } from './init-script'
import { defaultValues } from '@segment/actions-core'

declare global {
  interface Window {
    VWO: VWO
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, VWO> = {
  name: 'VWO Web Mode (Actions)',
  slug: 'actions-vwo-web',
  mode: 'device',
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    }
  ],
  settings: {
    // Add any Segment destination settings required here
    vwoAccountId: {
      description: 'The VWO AccountID from VWO dashboard',
      label: 'VWO Account ID',
      type: 'number',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    initScript({ vwoAccountId: settings.vwoAccountId })
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'VWO'), 100)
    return window.VWO
  },

  actions: {
    trackEvent
  }
}

export default browserDestination(destination)
