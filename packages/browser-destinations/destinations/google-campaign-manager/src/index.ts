import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import counterActivity from './counterActivity'

import salesActivity from './salesActivity'

declare global {
  interface Window {
    gtag: Function
    dataLayer: any
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Google Tag for Campaign Manager',
  slug: 'actions-google-campaign-manager',
  mode: 'device',

  settings: {
    advertiserId: {
      description:
        'In Campaign Manager, go to Floodlight -> Configuration, and Advertiser ID is located under the Configuration heading.',
      label: 'Advertiser ID',
      type: 'string',
      required: true,
      default: 'DC-'
    },
    allowAdPersonalizationSignals: {
      description:
        'This feature can be disabled if you do not want the global site tag to allow personalized remarketing data for site users',
      label: 'Activity Tag',
      type: 'boolean',
      required: true,
      default: true
    },
    conversionLinker: {
      description:
        'This feature can be disabled if you do not want the global site tag to set first party cookies on your site domain.',
      label: 'Activity Tag',
      type: 'boolean',
      required: true,
      default: true
    }
  },

  initialize: async ({ settings }, deps) => {
    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }

    window.gtag('set', 'allow_ad_personalization_signals', settings.allowAdPersonalizationSignals)
    window.gtag('js', new Date())
    window.gtag('config', settings.advertiserId, {
      conversion_linker: settings.conversionLinker
    })
    const script = `https://www.googletagmanager.com/gtag/js?id=${settings.advertiserId}`
    await deps.loadScript(script)
    return window.gtag
  },

  actions: {
    counterActivity,
    salesActivity
  }
}

export default browserDestination(destination)
