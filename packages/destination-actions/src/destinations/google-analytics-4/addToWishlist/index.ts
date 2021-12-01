import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { value, items, currency, client_id } from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Wishlist',
  description: 'Send event when a user adds items to a wishlist',
  defaultSubscription: 'type = "track" and event = "Product Added to Wishlist"',
  fields: {
    client_id: { ...client_id },
    currency: { ...currency },
    value: { ...value },
    items: {
      ...items,
      required: true,
      default: {
        '@arrayPath': [
          '$.properties',
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
    }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    if (payload.currency && !CURRENCY_ISO_CODES.includes(payload.currency)) {
      throw new IntegrationError(`${payload.currency} is not a valid currency code.`, 'Incorrect value format', 400)
    }

    // Google requires that currency be included at the event level if value is included.
    if (payload.value && payload.currency === undefined) {
      throw new IntegrationError('Currency is required if value is set.', 'Misconfigured required field', 400)
    }

    /**
     * Google requires a currency be specified either at the event level or the item level.
     * If set at the event level, item-level currency is ignored. If event-level currency is not set then
     * currency from the first item in items is used.
     */
    if (payload.currency === undefined && payload.items && payload.items[0].currency === undefined) {
      throw new IntegrationError(
        'One of item-level currency or top-level currency is required.',
        'Misconfigured required field',
        400
      )
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
            name: 'add_to_wishlist',
            params: {
              currency: payload.currency,
              value: payload.value,
              items: googleItems
            }
          }
        ]
      }
    })
  }
}

export default action
