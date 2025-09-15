import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, user_properties, params } from '../ga4-properties'
type ConsentParamsArg = 'granted' | 'denied' | undefined

const defaultCookieExpiryInSecond = 63072000
const defaultCookieDomain = 'auto'
// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Set Configuration Fields',
  description: 'Set custom values for the GA4 configuration fields.',
  platform: 'web',
  defaultSubscription: 'type = "page"',
  lifecycleHook: 'before',
  fields: {
    user_id: user_id,
    user_properties: user_properties,
    ads_storage_consent_state: {
      description:
        'Consent state indicated by the user for ad cookies. Value must be “granted” or “denied.” This is only used if the Enable Consent Mode setting is on.',
      label: 'Ads Storage Consent State',
      type: 'string',
      choices: [
        { label: 'Granted', value: 'granted' },
        { label: 'Denied', value: 'denied' }
      ],
      default: undefined
    },
    analytics_storage_consent_state: {
      description:
        'Consent state indicated by the user for ad cookies. Value must be “granted” or “denied.” This is only used if the Enable Consent Mode setting is on.',
      label: 'Analytics Storage Consent State',
      type: 'string',
      choices: [
        { label: 'Granted', value: 'granted' },
        { label: 'Denied', value: 'denied' }
      ],
      default: undefined
    },
    ad_user_data_consent_state: {
      description:
        'Consent state indicated by the user for ad cookies. Value must be "granted" or "denied." This is only used if the Enable Consent Mode setting is on.',
      label: 'Ad User Data Consent State',
      type: 'string',
      choices: [
        { label: 'Granted', value: 'granted' },
        { label: 'Denied', value: 'denied' }
      ],
      default: undefined
    },
    ad_personalization_consent_state: {
      description:
        'Consent state indicated by the user for ad cookies. Value must be "granted" or "denied." This is only used if the Enable Consent Mode setting is on.',
      label: 'Ad Personalization Consent State',
      type: 'string',
      choices: [
        { label: 'Granted', value: 'granted' },
        { label: 'Denied', value: 'denied' }
      ],
      default: undefined
    },
    campaign_content: {
      description:
        'Use campaign content to differentiate ads or links that point to the same URL. Setting this value will override the utm_content query parameter.',
      label: 'Campaign Content',
      type: 'string'
    },
    campaign_id: {
      description:
        'Use campaign ID to identify a specific campaign. Setting this value will override the utm_id query parameter. ',
      label: 'Campaign ID',
      type: 'string'
    },
    campaign_medium: {
      description:
        'Use campaign medium to identify a medium such as email or cost-per-click. Setting this value will override the utm_medium query parameter.',
      label: 'Campaign Medium',
      type: 'string'
    },
    campaign_name: {
      description:
        'Use campaign name to identify a specific product promotion or strategic campaign. Setting this value will override the utm_name query parameter.',
      label: 'Campaign Name',
      type: 'string'
    },
    campaign_source: {
      description:
        'Use campaign source to identify a search engine, newsletter name, or other source. Setting this value will override the utm_source query parameter.',
      label: 'Campaign Source',
      type: 'string'
    },
    campaign_term: {
      description:
        'Use campaign term to note the keywords for this ad. Setting this value will override the utm_term query parameter.',
      label: 'Campaign Term',
      type: 'string'
    },
    content_group: {
      description: `Categorize pages and screens into custom buckets so you can see metrics for related groups of information. More information in [Google documentation](https://support.google.com/analytics/answer/11523339).`,
      label: 'Content Group',
      type: 'string'
    },
    language: {
      description: `The language preference of the user. If not set, defaults to the user's navigator.language value.`,
      label: 'Language',
      type: 'string'
    },
    page_location: {
      description: `The full URL of the page. If not set, defaults to the user's document.location value.`,
      label: 'Page Location',
      type: 'string'
    },
    page_referrer: {
      description: `The referral source that brought traffic to a page. This value is also used to compute the traffic source. The format of this value is a URL. If not set, defaults to the user's document.referrer value.`,
      label: 'Page Referrer',
      type: 'string'
    },
    page_title: {
      description: `The title of the page or document. If not set, defaults to the user's document.title value.`,
      label: 'Page Title',
      type: 'string'
    },
    screen_resolution: {
      description: `The resolution of the screen. Format should be two positive integers separated by an x (i.e. 800x600). If not set, calculated from the user's window.screen value.`,
      label: 'Screen Resolution',
      type: 'string'
    },
    send_page_view: {
      description: 'Selection overrides toggled value set within Settings',
      label: 'Send Page Views',
      type: 'boolean',
      choices: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' }
      ],
      default: true
    },
    params: params
  },
  perform: (gtag, { payload, settings }) => {
    const checkCookiePathDefaultValue =
      settings.cookiePath != undefined && settings.cookiePath?.length !== 1 && settings.cookiePath !== '/'

    if (settings.enableConsentMode) {
      const consentParams: {
        ad_storage?: ConsentParamsArg
        analytics_storage?: ConsentParamsArg
        ad_user_data?: ConsentParamsArg
        ad_personalization?: ConsentParamsArg
      } = {}
      if (payload.ads_storage_consent_state) {
        consentParams.ad_storage = payload.ads_storage_consent_state.toLowerCase() as ConsentParamsArg
      }
      if (payload.analytics_storage_consent_state) {
        consentParams.analytics_storage = payload.analytics_storage_consent_state.toLowerCase() as ConsentParamsArg
      }
      if (payload.ad_user_data_consent_state) {
        consentParams.ad_user_data = payload.ad_user_data_consent_state as ConsentParamsArg
      }
      if (payload.ad_personalization_consent_state) {
        consentParams.ad_personalization = payload.ad_personalization_consent_state as ConsentParamsArg
      }
      gtag('consent', 'update', consentParams)
    }
    type ConfigType = { [key: string]: unknown }

    const config: ConfigType = {
      allow_ad_personalization_signals: settings.allowAdPersonalizationSignals,
      allow_google_signals: settings.allowGoogleSignals,
      ...payload.params
    }

    if (settings.cookieUpdate != true) {
      config.cookie_update = false
    }
    if (settings.cookieDomain != defaultCookieDomain) {
      config.cookie_domain = settings.cookieDomain
    }
    if (settings.cookiePrefix) {
      config.cookie_prefix = settings.cookiePrefix
    }
    if (settings.cookieExpirationInSeconds != defaultCookieExpiryInSecond) {
      config.cookie_expires = settings.cookieExpirationInSeconds
    }
    if (checkCookiePathDefaultValue) {
      config.cookie_path = settings.cookiePath
    }

    if (payload.send_page_view != true || settings.pageView != true) {
      config.send_page_view = payload.send_page_view ?? settings.pageView ?? true
    }
    if (settings.cookieFlags) {
      config.cookie_flags = settings.cookieFlags
    }

    if (payload.screen_resolution) {
      config.screen_resolution = payload.screen_resolution
    }
    if (payload.user_id) {
      config.user_id = payload.user_id
    }
    if (payload.user_properties) {
      config.user_properties = payload.user_properties
    }
    if (payload.page_title) {
      config.page_title = payload.page_title
    }
    if (payload.page_referrer) {
      config.page_referrer = payload.page_referrer
    }
    if (payload.page_location) {
      config.page_location = payload.page_location
    }
    if (payload.language) {
      config.language = payload.language
    }
    if (payload.content_group) {
      config.content_group = payload.content_group
    }
    if (payload.campaign_term) {
      config.campaign_term = payload.campaign_term
    }
    if (payload.campaign_source) {
      config.campaign_source = payload.campaign_source
    }
    if (payload.campaign_name) {
      config.campaign_name = payload.campaign_name
    }
    if (payload.campaign_medium) {
      config.campaign_medium = payload.campaign_medium
    }
    if (payload.campaign_id) {
      config.campaign_id = payload.campaign_id
    }
    if (payload.campaign_content) {
      config.campaign_content = payload.campaign_content
    }

    gtag('config', settings.measurementID, config)
  }
}

export default action
