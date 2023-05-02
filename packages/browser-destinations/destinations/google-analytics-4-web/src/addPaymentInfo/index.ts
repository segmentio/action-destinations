import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { updateUser } from '../ga4-functions'
import {
  user_id,
  user_properties,
  currency,
  value,
  coupon,
  payment_type,
  items_multi_products,
  params
} from '../ga4-properties'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Add Payment Info',
  description: 'Send event when a user submits their payment information',
  defaultSubscription: 'type = "track" and event = "Payment Info Entered"',
  platform: 'web',
  fields: {
    user_id: { ...user_id },
    currency: { ...currency },
    value: { ...value },
    coupon: { ...coupon },
    payment_type: { ...payment_type },
    items: {
      ...items_multi_products,
      required: true
    },
    user_properties: user_properties,
    params: params
  },
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)
    gtag('event', 'add_payment_info', {
      currency: payload.currency,
      value: payload.value,
      coupon: payload.coupon,
      payment_type: payload.payment_type,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
