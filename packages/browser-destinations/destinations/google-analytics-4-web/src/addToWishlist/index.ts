import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, value, currency, items_single_products, user_id } from '../ga4-properties'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Add to Wishlist',
  description:
    'The event signifies that an item was added to a wishlist. Use this event to identify popular gift items in your app.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Product Added to Wishlist"',
  fields: {
    user_id: user_id,
    currency: currency,
    value: value,
    items: {
      ...items_single_products,
      required: true
    },
    user_properties: user_properties,
    params: params
  },
  perform: (gtag, { payload }) => {
    gtag('event', 'add_to_wishlist', {
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
