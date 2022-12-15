import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { IntegrationError } from '@segment/actions-core'
import { ProductItem } from '../ga4-types'
import { verifyCurrency } from '../ga4-functions'
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
    console.log("reached addPaymentInfo")
    const payload = event.payload
    if (payload.user_id) {
      gtag('set', { 'user_id': payload.user_id })
    }
    if (payload.user_properties) {
      gtag('set', { 'user_properties': payload.user_properties })
    }


    // // Google requires that `add_payment_info` events include an array of products: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
    // // This differs from the Segment spec, which doesn't require a products array: https://segment.com/docs/connections/spec/ecommerce/v2/#payment-info-entered
    // if (payload.items && !payload.items.length) {
    //   throw new IntegrationError(
    //     'Google requires one or more products in add_payment_info events.',
    //     'Misconfigured required field',
    //     400
    //   )
    // }

    // if (payload.currency) {
    //   verifyCurrency(payload.currency)
    // }

    // // // Google requires that currency be included at the event level if value is included.
    // if (payload.value && payload.currency === undefined) {
    //   throw new IntegrationError('Currency is required if value is set.', 'Misconfigured required field', 400)
    // }

    // /**
    //  * Google requires a currency be specified either at the event level or the item level.
    //  * If set at the event level, item-level currency is ignored. If event-level currency is not set then
    //  * currency from the first item in items is used.
    //  */
    // if (payload.currency === undefined && payload.items[0].currency === undefined) {
    //   throw new IntegrationError(
    //     'One of item-level currency or top-level currency is required.',
    //     'Misconfigured required field',
    //     400
    //   )
    // }

    // let googleItems: ProductItem[] = []

    // if (payload.items) {
    //   googleItems = payload.items.map((product) => {
    //     if (product.item_name === undefined && product.item_id === undefined) {
    //       throw new IntegrationError(
    //         'One of product name or product id is required for product or impression data.',
    //         'Misconfigured required field',
    //         400
    //       )
    //     }

    //     if (product.currency) {
    //       verifyCurrency(product.currency)
    //     }

    //     return product as ProductItem
    //   })
    // }


    gtag("event", "add_payment_info", {
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
