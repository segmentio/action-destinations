import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES } from '../constants'
import { ProductItem } from '../ga4-types'

// https://segment.com/docs/connections/spec/ecommerce/v2/#order-completed
// https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events#purchase
const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Send purchase events to GA4 to make the most of the ecommerce reports in Google Analytics',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
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
    affiliation: {
      label: 'Affiliation',
      type: 'string',
      description: 'Store or affiliation from which this transaction occurred (e.g. Google Store).',
      default: {
        '@path': '$.properties.affiliation'
      }
    },
    coupon: {
      label: 'Coupon',
      type: 'string',
      description: 'Coupon code used for a purchase.',
      default: {
        '@path': '$.properties.coupon'
      }
    },
    currency: {
      label: 'Currency',
      type: 'string',
      description: 'Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.',
      required: true,
      default: {
        '@path': '$.properties.currency'
      }
    },
    // Google does not have anything to map position, url and image url fields (Segment spec) to
    // so will ignore for now
    items: {
      label: 'Products',
      description: 'The list of products purchased.',
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
          description: 'Store or affiliation from which this transaction occurred (e.g. Google Store).'
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
          description: 'Product category.'
        },
        item_variant: {
          label: 'Variant',
          type: 'string',
          description: 'Variant of the product (e.g. Black).'
        },
        tax: {
          label: 'Tax',
          type: 'number',
          description: 'Total tax associated with the transaction.'
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
    },
    transaction_id: {
      label: 'Order Id',
      type: 'string',
      description: 'The unique identifier of a transaction.',
      required: true,
      default: {
        '@path': '$.properties.order_id'
      }
    },
    shipping: {
      label: 'Shipping',
      type: 'number',
      description: 'Shipping cost associated with the transaction.',
      default: {
        '@path': '$.properties.shipping'
      }
    },
    tax: {
      label: 'Tax',
      type: 'number',
      description: 'Total tax associated with the transaction.',
      default: {
        '@path': '$.properties.tax'
      }
    },
    value: {
      label: 'Value',
      type: 'number',
      description: 'The monetary value of the event, in units of the specified currency parameter.',
      default: {
        '@path': '$.properties.total'
      }
    }
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
