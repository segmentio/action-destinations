import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

import addPaymentInfo from './addPaymentInfo'

import login from './login'

import signUp from './signUp'

import search from './search'

import addToCart from './addToCart'

import addToWishlist from './addToWishlist'

import removeFromCart from './removeFromCart'

import selectItem from './selectItem'

import selectPromotion from './selectPromotion'

import viewItem from './viewItem'

import viewPromotion from './viewPromotion'

import beginCheckout from './beginCheckout'

import purchase from './purchase'

import refund from './refund'

import viewCart from './viewCart'

import viewItemList from './viewItemList'

import generateLead from './generateLead'

declare global {
  interface Window {
    gtag: Function
    dataLayer: any
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Function> = {
  name: 'Google Analytics 4 Web',
  slug: 'actions-google-analytics-4-web',
  mode: 'device',

  settings: {
    measurementID: {
      description:
        'The measurement ID associated with the web stream. Found in the Google Analytics UI under: Admin > Data Streams > Web > Measurement ID.',
      label: 'Measurement ID',
      type: 'string',
      required: false
    },
    pageView: {
      description: 'Set to false to prevent the default snippet from sending page views. Enabled by default.',
      label: 'Page Views',
      type: 'boolean',
      default: true
    },
    allowGoogleSignals: {
      description: 'Set to false to disable all advertising features. Set to true by default.',
      label: 'Allow Google Signals',
      type: 'boolean',
      default: true
    },
    allowAdPersonalizationSignals: {
      description: 'Set to false to disable all advertising features. Set to true by default.',
      label: 'Allow Ad Personalization Signals',
      type: 'boolean',
      default: true
    },
    cookieDomain: {
      description: 'Specifies the domain used to store the analytics cookie. Set to “auto” by default.',
      label: 'Cookie Domain',
      type: 'string',
      default: 'auto'
    },
    cookieExpirationInSeconds: {
      description: `Every time a hit is sent to GA4, the analytics cookie expiration time is updated to be the current time plus the value of this field. The default value is two years (63072000 seconds). Please input the expiration value in seconds. More information in [Google Documentation](https://developers.google.com/analytics/devguides/collection/ga4/reference/config#)`,
      label: 'Cookie Expiration In Seconds',
      type: 'number',
      default: 63072000
    },
    cookieFlags: {
      description: `Appends additional flags to the analytics cookie.  See [write a new cookie](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie#write_a_new_cookie) for some examples of flags to set.`,
      label: 'Cookie Flag',
      type: 'string',
      multiple: true
    },
    cookiePath: {
      description: `Specifies the subpath used to store the analytics cookie.`,
      label: 'Cookie Path',
      type: 'string',
      multiple: true
    },
    cookiePrefix: {
      description: `Specifies a prefix to prepend to the analytics cookie name.`,
      label: 'Cookie Prefix',
      type: 'string',
      multiple: true
    },
    cookieUpdate: {
      description: `Set to false to not update  cookies on each page load. This has the effect of cookie expiration being relative to the first time a user visited. Set to true by default so update cookies on each page load.`,
      label: 'Cookie Update',
      type: 'boolean',
      default: true
    },
    enableConsentMode: {
      description: `Set to true to enable Google’s [Consent Mode](https://support.google.com/analytics/answer/9976101?hl=en). Set to false by default.`,
      label: 'Enable Consent Mode',
      type: 'boolean',
      default: false
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
      default: 'granted'
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
      default: 'granted'
    },
    waitTimeToUpdateConsentStage: {
      description:
        'If your CMP loads asynchronously, it might not always run before the Google tag. To handle such situations, specify a millisecond value to control how long to wait before the consent state update is sent. Please input the wait_for_update in milliseconds.',
      label: 'Wait Time to Update Consent State',
      type: 'number'
    }
  },

  initialize: async ({ settings }, deps) => {
    // const config = {
    //   send_page_view: settings.pageView,
    //   cookie_update: settings.cookieUpdate,
    //   cookie_domain: settings.cookieDomain,
    //   cookie_prefix: settings.cookiePrefix,
    //   cookie_expires: settings.cookieExpirationInSeconds,
    //   cookie_path: settings.cookiePath,
    //   allow_ad_personalization_signals: settings.allowAdPersonalizationSignals,
    //   allow_google_signals: settings.allowGoogleSignals
    // }
    //TODO
    // const consent = {

    // }
    window.dataLayer = window.dataLayer || []
    // window.gtag = function () {
    //   window.dataLayer.push(arguments)
    // }
    window.gtag('js', new Date())
    //Easier for testing actions
    window.gtag('config', settings.measurementID)
    //window.gtag('config', settings.measurementID, { config })
    const script = `https://www.googletagmanager.com/gtag/js?id=G-P8JMEEJC9G`
    await deps.loadScript(script)
    console.log('loaded')
    //add ResolveWhen
    return window.gtag
  },

  actions: {
    addPaymentInfo,
    login,
    signUp,
    search,
    addToCart,
    addToWishlist,
    removeFromCart,
    selectItem,
    selectPromotion,
    viewItem,
    viewPromotion,
    beginCheckout,
    purchase,
    refund,
    viewCart,
    viewItemList,
    generateLead
  }
}

export default browserDestination(destination)
