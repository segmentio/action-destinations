import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, method } from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Sign Up',
  description: 'The method used for sign up.',
  defaultSubscription: 'type = "track" and event = "Signed Up"',
  platform: 'web',
  fields: {
    user_id: user_id,
    method: method,
    user_properties: user_properties,
    params: params
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'sign_up', {
      method: payload.method,
      user_id: payload.user_id ?? undefined,
      user_properties: payload.user_properties,
      send_to: settings.measurementID,
      ...payload.params
    })
  }
}

export default action
