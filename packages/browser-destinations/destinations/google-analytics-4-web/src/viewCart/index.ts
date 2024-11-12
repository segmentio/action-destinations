import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, currency, value, user_id, items_multi_products, send_to } from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'View Cart',
  description: 'This event signifies that a user viewed their cart.',
  defaultSubscription: 'type = "track" and event = "Cart Viewed"',
  platform: 'web',
  fields: {
    user_id: user_id,
    currency: currency,
    value: value,
    items: {
      ...items_multi_products,
      required: true
    },
    user_properties: user_properties,
    params: params,
    send_to: send_to
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'view_cart', {
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
      user_id: payload.user_id ?? undefined,
      user_properties: payload.user_properties,
      send_to: payload.send_to == true ? settings.measurementID : 'default',
      ...payload.params
    })
  }
}

export default action
