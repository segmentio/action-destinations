import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_id,
  user_properties,
  currency,
  value,
  coupon,
  payment_type,
  items_multi_products,
  params,
  send_to
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
    params: params,
    send_to: send_to
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'add_payment_info', {
      currency: payload.currency,
      value: payload.value,
      coupon: payload.coupon,
      payment_type: payload.payment_type,
      items: payload.items,
      user_id: payload.user_id ?? undefined,
      user_properties: payload.user_properties,
      send_to: payload.send_to == true ? settings.measurementID : 'default',
      ...payload.params
    })
  }
}

export default action
