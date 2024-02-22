import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, currency, value, send_to } from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Generate Lead',
  description:
    'Log this event when a lead has been generated to understand the efficacy of your re-engagement campaigns.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    user_id: user_id,
    currency: currency,
    value: value,
    user_properties: user_properties,
    params: params,
    send_to: send_to
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'generate_lead', {
      currency: payload.currency,
      value: payload.value,
      user_id: payload.user_id ?? undefined,
      user_properties: payload.user_properties,
      send_to: payload.send_to == true ? settings.measurementID : 'default',
      ...payload.params
    })
  }
}

export default action
