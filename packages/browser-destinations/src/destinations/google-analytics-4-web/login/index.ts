import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, method } from '../ga4-properties'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Login',
  description: 'Send event when a user logs in',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    user_id: user_id,
    method: method,
    user_properties: user_properties,
    params: params
  },

  perform: (gtag, event) => {
    const payload = event.payload
    if (payload.user_id) {
      gtag('set', { user_id: payload.user_id })
    }
    if (payload.user_properties) {
      gtag('set', { user_properties: payload.user_properties })
    }

    gtag('event', 'login', {
      method: payload.method,
      ...payload.params
    })
  }
}

export default action
