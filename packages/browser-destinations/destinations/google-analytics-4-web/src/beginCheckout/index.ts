import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { params, coupon, currency, value, items_multi_products, user_id, user_properties } from '../ga4-properties'
import { updateUser } from '../ga4-functions'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Begin Checkout',
  description: 'This event signifies that a user has begun a checkout.',
  defaultSubscription: 'type = "track" and event = "Checkout Started"',
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
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)

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
