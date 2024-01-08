import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, search_term } from '../ga4-properties'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Search',
  description: 'The term that was searched for.',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  platform: 'web',
  fields: {
    user_id: user_id,
    user_properties: user_properties,
    params: params,
    search_term: search_term
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'search', {
      search_term: payload.search_term,
      send_to: settings.measurementID,
      user_id: payload.user_id ?? null,
      ...payload.user_properties,
      ...payload.params
    })
  }
}

export default action
