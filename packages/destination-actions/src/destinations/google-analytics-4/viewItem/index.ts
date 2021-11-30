import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { currency, client_id, value, items } from '../ga4-properties'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'View Item',
  description: 'Send event when a user views an item',
  defaultSubscription: 'type = "track" and event =  "Product Viewed"',
  fields: {
    client_id: { ...client_id, required: true },
    currency: { ...currency, default: { '@path': '$.properties.currency' } },
    value: { ...value, default: { '@path': '$.properties.value' } },
    items: {
      ...items,
      required: true,
      default: {
        '@arrayList': [
          '$.properties',
          {
            item_id: {
              '@path': '$.properties.product_id'
            },
            item_name: {
              '@path': '$.properties.name'
            },
            affiliation: {
              '@path': '$.properties.affiliation'
            },
            coupon: {
              '@path': '$.properties.coupon'
            },
            item_brand: {
              '@path': '$.properties.brand'
            },
            item_category: {
              '@path': '$.properties.category'
            },
            item_variant: {
              '@path': '$.properties.variant'
            },
            price: {
              '@path': '$.properties.price'
            },
            quantity: {
              '@path': '$.properties.quantity'
            }
          }
        ]
      }
    }
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

        return {
          item_id: product.item_id,
          item_name: product.item_name,
          quantity: product.quantity,
          affiliation: product.affiliation,
          coupon: product.coupon,
          discount: product.discount,
          item_brand: product.item_brand,
          item_category: product.item_category,
          item_variant: product.item_variant,
          price: product.price,
          currency: product.currency
        } as ProductItem
      })
    }

    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        events: [
          {
            name: 'view_item',
            params: {
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
