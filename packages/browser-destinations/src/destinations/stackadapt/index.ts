import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { defaultValues } from '@segment/actions-core'
import { initScript } from './init-script'
import trackEvent from './trackEvent'
import { StackAdaptSDK } from './types'

declare global {
  interface Window {
    saq: StackAdaptSDK
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, StackAdaptSDK> = {
  name: 'StackAdapt',
  slug: 'actions-stackadapt',
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
    universalPixelId: {
      description: 'The universal pixel id for StackAdapt.',
      label: 'Universal Pixel Id',
      type: 'string',
      required: true
    }
  },

  initialize: async (_, dependencies) => {
    initScript()
    await dependencies.loadScript('https://tags.srv.stackadapt.com/events.js')

    return window.saq
  },

  actions: {
    trackEvent
  }
}

export default browserDestination(destination)
