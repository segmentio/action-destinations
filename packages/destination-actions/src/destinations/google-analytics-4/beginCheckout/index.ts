import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { coupon, currency, items, client_id, value } from '../ga4-properties'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Begin Checkout',
  description: 'Send event when a user begins checkout',
  defaultSubscription: 'type = "track" and event = "Checkout Started"',
  fields: {
    client_id: { ...client_id },
    coupon: { ...coupon, default: { '@path': '$.properties.coupon' } },
    currency: { ...currency, default: { '@path': '$.properties.currency' } },
    // Google does not have anything to map position, url and image url fields (Segment spec) to
    // so will ignore for now
    items: {
      ...items,
      required: true,
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            item_id: {
              '@path': '$.product_id'
            },
            item_name: {
              '@path': '$.name'
            },
            affiliation: {
              '@path': '$.affiliation'
            },
            coupon: {
              '@path': '$.coupon'
            },
            index: {
              '@path': '$.position'
            },
            item_brand: {
              '@path': '$.brand'
            },
            item_category: {
              '@path': '$.category'
            },
            item_variant: {
              '@path': '$.variant'
            },
            price: {
              '@path': '$.price'
            },
            quantity: {
              '@path': '$.quantity'
            }
          }
        ]
      }
    },
    value: { ...value, default: { '@path': '$.properties.value' } }
  },
  perform: (request, { payload }) => {
    if (payload.currency && !CURRENCY_ISO_CODES.includes(payload.currency)) {
      throw new IntegrationError(`${payload.currency} is not a valid currency code.`, 'Incorrect value format', 400)
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
            name: 'begin_checkout',
            params: {
              coupon: payload.coupon,
              currency: payload.currency,
              items: googleItems,
              value: payload.value
            }
          }
        ]
      }
    })
  }
}

export default action
