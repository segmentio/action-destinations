import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, value, currency, items_single_products, user_id } from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Add to Cart',
  description: 'This event signifies that an item was added to a cart for purchase.',
  defaultSubscription: 'type = "track"',
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
  perform: (gtag, event) => {
    const payload = event.payload
    if (payload.user_id) {
      gtag('set', { user_id: payload.user_id })
    }
    if (payload.user_properties) {
      gtag('set', { user_properties: payload.user_properties })
    }

    gtag('event', 'add_to_cart', {
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
