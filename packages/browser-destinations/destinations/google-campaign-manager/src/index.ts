import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Google Campaign Manager',
  slug: 'actions-google-campaign-manager',
  mode: 'device',

  settings: {
    floodlightConfigID: {
      description: 'This field identifies the Floodlight configuration the tag is associated with.',
      label: 'Floodlight Config ID',
      type: 'string',
      required: true,
      default: 'DC-'
    },
    activityGroupTagString: {
      description: 'This field identifies the Floodlight activity group the tag is associated with.',
      label: 'Activity Group Tag',
      type: 'string',
      required: false
    },
    activityTagString: {
      description: 'This identifies the Floodlight activity the tag is associated with.',
      label: 'Activity Tag',
      type: 'string',
      required: false
    },
    allowAdPersonalizationSignals: {
      description: 'This allows you disable to the usage of the data for personalized ads.',
      label: 'Activity Tag',
      type: 'boolean',
      required: false,
      default: false
    }
  },

  //TODO: allowCustomScripts, variables, send_to
  // TODO: counter vs sales?

  initialize: async ({ settings }, deps) => {
    const config = {
      allow_ad_personalization_signals: settings.allowAdPersonalizationSignals
    }

    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }

    window.gtag('js', new Date())
    window.gtag('config', settings.floodlightConfigID, config)
    const script = `https://www.googletagmanager.com/gtag/js?id=${settings.floodlightConfigID}`
    await deps.loadScript(script)
    return window.gtag
  },

  actions: {}
}

export default browserDestination(destination)
