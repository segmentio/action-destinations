import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import {
  coupon,
  transaction_id,
  user_id,
  currency,
  value,
  affiliation,
  shipping,
  items_multi_products,
  params,
  user_properties,
  tax
} from '../ga4-properties'
import { updateUser } from '../ga4-functions'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Refund',
  description: 'This event signifies when one or more items is refunded to a user.',
  defaultSubscription: 'type = "track" and event = "Order Refunded"',
  platform: 'web',
  fields: {
    user_id: user_id,
    currency: currency,
    transaction_id: { ...transaction_id, required: true },
    value: { ...value, default: { '@path': '$.properties.total' } },
    affiliation: affiliation,
    coupon: coupon,
    shipping: shipping,
    tax: tax,
    items: {
      ...items_multi_products
    },
    user_properties: user_properties,
    params: params
  },
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)

    gtag('event', 'refund', {
      currency: payload.currency,
      transaction_id: payload.transaction_id, // Transaction ID. Required for purchases and refunds.
      value: payload.value,
      affiliation: payload.affiliation,
      coupon: payload.coupon,
      shipping: payload.shipping,
      tax: payload.tax,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
