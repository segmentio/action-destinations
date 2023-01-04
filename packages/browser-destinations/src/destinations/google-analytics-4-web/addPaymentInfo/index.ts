import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
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
  params
} from '../ga4-properties'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Add Payment Info',
  description: 'Send event when a user submits their payment information',
  defaultSubscription: 'type = "track"',
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
  perform: (gtag, event) => {
    const payload = event.payload
    if (payload.user_id) {
      gtag('set', { user_id: payload.user_id })
    }
    if (payload.user_properties) {
      gtag('set', { user_properties: payload.user_properties })
    }

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
