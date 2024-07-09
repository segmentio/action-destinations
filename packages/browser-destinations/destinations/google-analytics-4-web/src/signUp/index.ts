import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, method, send_to } from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Sign Up',
  description: 'The method used for sign up.',
  defaultSubscription: 'type = "track" and event = "Signed Up"',
  platform: 'web',
  fields: {
    user_id: user_id,
    method: method,
    user_properties: user_properties,
    params: params,
    send_to: send_to
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'sign_up', {
      method: payload.method,
      user_id: payload.user_id ?? undefined,
      user_properties: payload.user_properties,
      send_to: payload.send_to == true ? settings.measurementID : 'default',
      ...payload.params
    })
  }
}

export default action
