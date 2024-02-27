import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, method } from '../ga4-properties'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Login',
  description: 'Send event when a user logs in',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Signed In"',
  fields: {
    user_id: user_id,
    method: method,
    user_properties: user_properties,
    params: params
  },

  perform: (gtag, { payload }) => {
    gtag('event', 'login', {
      method: payload.method,
      user_id: payload.user_id ?? undefined,
      user_properties: payload.user_properties,
      ...payload.params
    })
  }
}

export default action
