import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, value, user_id, currency, items_single_products } from '../ga4-properties'
import { updateUser } from '../ga4-functions'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Remove from Cart',
  description: 'This event signifies that an item was removed from a cart.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Product Removed"',
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
    updateUser(payload.user_id, payload.user_properties, gtag)

    gtag('event', 'remove_from_cart', {
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
