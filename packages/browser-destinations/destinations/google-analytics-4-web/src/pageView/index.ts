import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, user_properties } from '../ga4-properties'
import { updateUser } from '../ga4-functions'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Page View',
  description:
    'When you want to manually control how pageviews are sent. Please make sure to disable the pageview toggle setting or you may end up with duplicate pageviews',
  platform: 'web',
  defaultSubscription: 'type = "page"',
  fields: {
    user_id: user_id,
    user_properties: user_properties,
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
    }
  },
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)
    if (payload.page_title) {
      gtag('set', { page_title: payload.page_title })
    }
    if (payload.page_referrer) {
      gtag('set', { page_referrer: payload.page_referrer })
    }
    if (payload.page_location) {
      gtag('set', { page_location: payload.page_location })
    }
    gtag('event', 'page_view')
  }
}

export default action
