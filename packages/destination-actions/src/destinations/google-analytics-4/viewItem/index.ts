import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'View Item',
  description: 'Send view item events to GA4 to make the most of the ecommerce reports in Google Analytics',
  defaultSubscription: 'type = "track" and event =  "Product Viewed"',
  fields: {
    client_id: {
      label: 'Client ID',
      description: 'Uniquely identifies a user instance of a web client.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    currency: {
      label: 'Currency',
      type: 'string',
      description: 'Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.',
      default: {
        '@path': '$.properties.currency'
      }
    },
    value: {
      label: 'Value',
      type: 'number',
      description: 'The monetary value of the event, in units of the specified currency parameter.',
      default: {
        '@path': '$.properties.value'
      }
    },
    items: {
      label: 'Products',
      description: 'The list of products in the event.',
      type: 'object',
      multiple: true,
      properties: {
        item_id: {
          label: 'Product ID',
          type: 'string',
          description: 'Identifier for the product being purchased.'
        },
        item_name: {
          label: 'Name',
          type: 'string',
          description: 'Name of the product being purchased.'
        },
        quantity: {
          label: 'Quantity',
          type: 'integer',
          description: 'Item quantity.'
        },
        affiliation: {
          label: 'Affiliation',
          type: 'string',
          description: 'A product affiliation to designate a supplying company or brick and mortar store location.'
        },
        coupon: {
          label: 'Coupon',
          type: 'string',
          description: 'Coupon code used for a purchase.'
        },
        discount: {
          label: 'Discount',
          type: 'number',
          description: 'Monetary value of discount associated with a purchase.'
        },
        item_brand: {
          label: 'Brand',
          type: 'string',
          description: 'Brand associated with the product.'
        },
        item_category: {
          label: 'Category',
          type: 'string',
          description: 'Category of the product.'
        },
        item_variant: {
          label: 'Variant',
          type: 'string',
          description: 'Variant of the product (e.g. Black).'
        },
        price: {
          label: 'Price',
          type: 'number',
          description: 'Price of the product being purchased, in units of the specified currency parameter.'
        },
        currency: {
          label: 'Currency',
          type: 'string',
          description: 'Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.'
        }
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
