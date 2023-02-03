import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, user_properties } from '../ga4-properties'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Set Configuration Fields',
  description: 'Set custom values for the GA4 configuration fields.',
  platform: 'web',
  defaultSubscription: 'type = "identify" or type = "page"',
  fields: {
    user_id: user_id,
    user_properties: user_properties,
    ads_storage_consent_state: {
      description:
        'Consent state indicated by the user for ad cookies. Value must be “granted” or “denied.” This is only used if the Enable Consent Mode setting is on.',
      label: 'Ads Storage Consent State',
      type: 'string'
    },
    analytics_storage_consent_state: {
      description:
        'Consent state indicated by the user for ad cookies. Value must be “granted” or “denied.” This is only used if the Enable Consent Mode setting is on.',
      label: 'Analytics Storage Consent State',
      type: 'string'
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
    }
  },
  perform: (gtag, event) => {
    const payload = event.payload
    const settings = event.settings
    if (settings.enableConsentMode) {
      window.gtag('consent', 'update', {
        ad_storage: payload.ads_storage_consent_state,
        analytics_storage: payload.analytics_storage_consent_state
      })
    }
    const properties = [
      'screen_resolution',
      'page_title',
      'page_referrer',
      '...'
    ]

    gtag('set', Object.fromEntries(
      properties
        .map((key) => [key, payload[key]])
        .filter(([, value]) => !value)
    ))
  }
}

export default action
