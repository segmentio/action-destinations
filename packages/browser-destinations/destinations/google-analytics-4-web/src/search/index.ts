import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, search_term, send_to } from '../ga4-properties'

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
    search_term: search_term,
    send_to: send_to
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'search', {
      search_term: payload.search_term,
      user_id: payload.user_id ?? undefined,
      user_properties: payload.user_properties,
      send_to: payload.send_to == true ? settings.measurementID : 'default',
      ...payload.params
    })
  }
}

export default action
