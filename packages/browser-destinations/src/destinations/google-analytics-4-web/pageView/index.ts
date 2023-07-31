import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, user_properties } from '../ga4-properties'
import { updateUser } from '../ga4-functions'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Page View',
  description: 'Send page view when a user views a page.',
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
    },
    language: {
      description: `The language for the client. See [Language tags and codes](https://en.wikipedia.org/wiki/Language_localisation#Language_tags_and_codes).`,
      label: 'Language',
      type: 'string'
    },
    user_agent: {
      description: `The client's user agent.`,
      label: 'User Agent',
      type: 'string'
    }
  },
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)
    gtag('event', 'page_view', {
      page_title: payload.page_title,
      page_location: payload.page_location,
      page_referrer: payload.page_referrer,
      language: payload.language,
      user_agent: payload.user_agent
    })
  }
}

export default action
