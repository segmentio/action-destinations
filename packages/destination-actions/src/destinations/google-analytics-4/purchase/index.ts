import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES } from '../constants'
import { ProductItem } from '../ga4-types'
import {
  coupon,
  currency,
  transaction_id,
  value,
  client_id,
  affiliation,
  shipping,
  tax,
  items_multi_products
} from '../ga4-properties'

// https://segment.com/docs/connections/spec/ecommerce/v2/#order-completed
// https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events#purchase
const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Send event when a user completes a purchase',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    client_id: { ...client_id },
    affiliation: { ...affiliation },
    coupon: { ...coupon, default: { '@path': '$.properties.coupon' } },
    currency: { ...currency, required: true },
    // Google does not have anything to map position, url and image url fields (Segment spec) to
    // so will ignore for now
    items: {
      ...items_multi_products,
      required: true
    },
    transaction_id: { ...transaction_id, required: true },
    shipping: { ...shipping },
    tax: { ...tax },
    value: { ...value, default: { '@path': '$.properties.total' } }
  },
  perform: (request, { payload }) => {
    if (!CURRENCY_ISO_CODES.includes(payload.currency)) {
      throw new Error(`${payload.currency} is not a valid currency code.`)
    }

    let googleItems: ProductItem[] = []

    if (payload.items) {
      googleItems = payload.items.map((product) => {
        if (product.item_name === undefined && product.item_id === undefined) {
          throw new IntegrationError(
            'One of product name or product id is required for product or impression data.',
            'Misconfigured required field',
            400
          )
        }

        if (product.currency && !CURRENCY_ISO_CODES.includes(product.currency)) {
          throw new IntegrationError(`${product.currency} is not a valid currency code.`, 'Incorrect value format', 400)
        }

        return product as ProductItem
      })
    }

    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        events: [
          {
            name: 'purchase',
            params: {
              affiliation: payload.affiliation,
              coupon: payload.coupon,
              currency: payload.currency,
              items: googleItems,
              transaction_id: payload.transaction_id,
              shipping: payload.shipping,
              value: payload.value,
              tax: payload.tax
            }
          }
        ]
      }
    })
  }
}

export default action
