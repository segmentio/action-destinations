import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { defaultValues } from '@segment/actions-core'
import { initScript } from './init-script'
import trackEvent, { trackEventDefaultSubscription } from './trackEvent'
import trackPage, { trackPageDefaultSubscription } from './trackPage'
import type { StackAdaptSDK } from './types'

declare global {
  interface Window {
    saq: StackAdaptSDK
  }
}

export const destination: BrowserDestinationDefinition<Settings, StackAdaptSDK> = {
  name: 'StackAdapt (Actions)',
  slug: 'actions-stackadapt',
  mode: 'device',
  presets: [
    {
      name: 'Track Event',
      subscribe: trackEventDefaultSubscription,
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Track Page',
      subscribe: trackPageDefaultSubscription,
      partnerAction: 'trackPage',
      mapping: defaultValues(trackPage.fields),
      type: 'automatic'
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
    trackEvent,
    trackPage
  }
}

export default browserDestination(destination)
