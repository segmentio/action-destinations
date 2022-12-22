import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { params, coupon, currency, value, items_multi_products, user_id, user_properties } from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Begin Checkout',
  description: 'This event signifies that a user has begun a checkout.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    user_id: user_id,
    coupon: { ...coupon, default: { '@path': '$.properties.coupon' } },
    currency: currency,
    items: {
      ...items_multi_products,
      required: true
    },
    value: value,
    params: params,
    user_properties: user_properties
  },
  perform: (gtag, event) => {
    const payload = event.payload
    if (payload.user_id) {
      gtag('set', { user_id: payload.user_id })
    }
    if (payload.user_properties) {
      gtag('set', { user_properties: payload.user_properties })
    }

    gtag('event', 'begin_checkout', {
      currency: payload.currency,
      value: payload.value,
      coupon: payload.coupon,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
