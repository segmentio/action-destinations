import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { updateUser } from '../ga4-functions'

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
    updateUser(payload.user_id, payload.user_properties, gtag)

    gtag('event', 'add_to_cart', {
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
