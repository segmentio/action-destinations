import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  coupon,
  currency,
  transaction_id,
  value,
  user_id,
  shipping,
  tax,
  items_multi_products,
  params,
  user_properties
} from '../ga4-properties'
import { updateUser } from '../ga4-functions'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Purchase',
  description: 'This event signifies when one or more items is purchased by a user.',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  platform: 'web',
  fields: {
    user_id: user_id,
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
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)

    gtag('event', 'purchase', {
      currency: payload.currency,
      transaction_id: payload.transaction_id,
      value: payload.value,
      coupon: payload.coupon,
      tax: payload.tax,
      shipping: payload.shipping,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
