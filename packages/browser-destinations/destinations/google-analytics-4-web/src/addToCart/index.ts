import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, value, currency, items_single_products, user_id } from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Add to Cart',
  description: 'This event signifies that an item was added to a cart for purchase.',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  platform: 'web',
  fields: {
    user_id: user_id,
    currency: currency,
    items: {
      ...items_single_products,
      required: true
    },
    value: value,
    user_properties: user_properties,
    params: params
  },
  perform: (gtag, { payload }) => {
    gtag('event', 'add_to_cart', {
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
