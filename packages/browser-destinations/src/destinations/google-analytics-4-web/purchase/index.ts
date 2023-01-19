import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import {
  coupon,
  currency,
  transaction_id,
  value,
  user_id,
  affiliation,
  shipping,
  tax,
  items_multi_products,
  params,
  user_properties
} from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Purchase',
  description: 'This event signifies when one or more items is purchased by a user.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    user_id: user_id,
    affiliation: affiliation,
    coupon: { ...coupon, default: { '@path': '$.properties.coupon' } },
    currency: { ...currency, required: true },
    items: {
      ...items_multi_products,
      required: true
    },
    transaction_id: { ...transaction_id, required: true },
    shipping: shipping,
    tax: tax,
    value: { ...value, default: { '@path': '$.properties.total' } },
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

    gtag('event', 'purchase', {
      transaction_id: payload.transaction_id,
      affiliation: payload.affiliation,
      value: payload.value,
      tax: payload.tax,
      shipping: payload.shipping,
      currency: payload.currency,
      coupon: payload.coupon,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
