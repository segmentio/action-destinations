import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, currency, value, user_id, items_multi_products } from '../ga4-properties'

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
    params: params
  },
  perform: (gtag, { payload }) => {
    gtag('event', 'view_cart', {
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
      user_id: payload.user_id ?? undefined,
      user_properties: payload.user_properties,
      ...payload.params
    })
  }
}

export default action
