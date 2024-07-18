import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import counterActivity from './counterActivity'
import salesActivity from './salesActivity'

declare global {
  interface Window {
    gtag: typeof gtag
    dataLayer: any
  }
}

type ConsentParamsArg = 'granted' | 'denied' | undefined

export const destination: BrowserDestinationDefinition<Settings, Function> = {
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
        'This feature can be disabled if you do not want the global site tag to allow personalized remarketing data for site users.',
      label: 'Allow Ad Personalization Signals',
      type: 'boolean',
      required: true,
      default: true
    },
    conversionLinker: {
      description:
        'This feature can be disabled if you do not want the global site tag to set first party cookies on your site domain.',
      label: 'Conversion Linker',
      type: 'boolean',
      required: true,
      default: true
    },
    enableConsentMode: {
      description: `Set to true to enable Google’s [Consent Mode](https://support.google.com/analytics/answer/9976101?hl=en). Set to false by default.`,
      label: 'Enable Consent Mode',
      type: 'boolean',
      default: false
    },
    adUserDataConsentState: {
      description:
        'Consent state indicated by the user for ad cookies. Value must be "granted" or "denied." This is only used if the Enable Consent Mode setting is on.',
      label: 'Ad User Data Consent State',
      type: 'string',
      choices: [
        { label: 'Granted', value: 'granted' },
        { label: 'Denied', value: 'denied' }
      ],
      default: undefined,
      depends_on: {
        conditions: [
          {
            fieldKey: 'enableConsentMode',
            operator: 'is',
            value: true
          }
        ]
      }
    },
    adPersonalizationConsentState: {
      description:
        'Consent state indicated by the user for ad cookies. Value must be "granted" or "denied." This is only used if the Enable Consent Mode setting is on.',
      label: 'Ad Personalization Consent State',
      type: 'string',
      choices: [
        { label: 'Granted', value: 'granted' },
        { label: 'Denied', value: 'denied' }
      ],
      default: undefined,
      depends_on: {
        conditions: [
          {
            fieldKey: 'enableConsentMode',
            operator: 'is',
            value: true
          }
        ]
      }
    },
    defaultAdsStorageConsentState: {
      description:
        'The default value for ad cookies consent state. This is only used if Enable Consent Mode is on. Set to  “granted” if it is not explicitly set. Consent state can be updated for each user in the Set Configuration Fields action.',
      label: 'Default Ads Storage Consent State',
      type: 'string',
      choices: [
        { label: 'Granted', value: 'granted' },
        { label: 'Denied', value: 'denied' }
      ],
      default: undefined,
      depends_on: {
        conditions: [
          {
            fieldKey: 'enableConsentMode',
            operator: 'is',
            value: true
          }
        ]
      }
    },
    defaultAnalyticsStorageConsentState: {
      description:
        'The default value for analytics cookies consent state. This is only used if Enable Consent Mode is on. Set to  “granted” if it is not explicitly set. Consent state can be updated for each user in the Set Configuration Fields action.',
      label: 'Default Analytics Storage Consent State',
      type: 'string',
      choices: [
        { label: 'Granted', value: 'granted' },
        { label: 'Denied', value: 'denied' }
      ],
      default: undefined,
      depends_on: {
        conditions: [
          {
            fieldKey: 'enableConsentMode',
            operator: 'is',
            value: true
          }
        ]
      }
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
    if (settings.enableConsentMode) {
      const consent: {
        ad_storage?: ConsentParamsArg
        analytics_storage?: ConsentParamsArg
        ad_user_data?: ConsentParamsArg
        ad_personalization?: ConsentParamsArg
        allow_ad_personalization_signals?: Boolean
      } = {}

      if (settings.defaultAnalyticsStorageConsentState) {
        consent.analytics_storage = settings.defaultAnalyticsStorageConsentState as ConsentParamsArg
      }
      if (settings.defaultAdsStorageConsentState) {
        consent.ad_storage = settings.defaultAdsStorageConsentState as ConsentParamsArg
      }
      if (settings.adUserDataConsentState) {
        consent.ad_user_data = settings.adUserDataConsentState as ConsentParamsArg
      }
      if (settings.adPersonalizationConsentState) {
        consent.ad_personalization = settings.adPersonalizationConsentState as ConsentParamsArg
      }

      window.gtag('consent', 'default', consent)
    }
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
