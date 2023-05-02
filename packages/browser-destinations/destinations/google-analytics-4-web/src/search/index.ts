import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, search_term } from '../ga4-properties'
import { updateUser } from '../ga4-functions'

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
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)

    gtag('event', 'search', {
      search_term: payload.search_term,
      ...payload.params
    })
  }
}

export default action
