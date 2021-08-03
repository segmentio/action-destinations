import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

/**
 * Follows Google Analytics spec at:
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events#view_item_list
 */
const action: ActionDefinition<Settings, Payload> = {
  title: 'View Item List',
  description: 'Send view item list events to GA4.',
  defaultSubscription: 'type = "track" and event = "Product List Viewed"',
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
    item_list_id: {
      label: 'Item List ID',
      type: 'string',
      description: 'The ID of the list in which the item was presented to the user.',
      default: {
        '@path': `$.properties.list_id`
      }
    },
    item_list_name: {
      label: 'Item List Name',
      type: 'string',
      description: 'The name of the list in which the item was presented to the user.',
      default: {
        '@path': '$.properties.category'
      }
    },
    items: {
      label: 'Products',
      description: 'The list of products in the event.',
      type: 'object',
      multiple: true,
      required: true,
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
        currency: {
          label: 'Currency',
          type: 'string',
          description: 'Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.'
        },
        discount: {
          label: 'Discount',
          type: 'number',
          description: 'Monetary value of discount associated with a purchase.'
        },
        index: {
          label: 'Index',
          type: 'number',
          description: 'The index/position of the item in a list.'
        },
        item_brand: {
          label: 'Brand',
          type: 'string',
          description: 'Brand associated with the product.'
        },
        item_category: {
          label: 'Category',
          type: 'string',
          description: 'The category of the item.'
        },
        item_category2: {
          label: 'Category 2',
          type: 'string',
          description: 'The second category hierarchy or additional taxonomy for the item.'
        },
        item_category3: {
          label: 'Category 3',
          type: 'string',
          description: 'The third category hierarchy or additional taxonomy for the item.'
        },
        item_category4: {
          label: 'Category 4',
          type: 'string',
          description: 'The fourth category hierarchy or additional taxonomy for the item.'
        },
        item_category5: {
          label: 'Category 5',
          type: 'string',
          description: 'The fifth category hierarchy or additional taxonomy for the item.'
        },
        item_list_id: {
          label: 'Item List ID',
          type: 'string',
          description: 'The ID of the list in which the item was presented to the user.'
        },
        item_list_name: {
          label: 'Item List Name',
          type: 'string',
          description: 'The name of the list in which the item was presented to the user.'
        },
        item_variant: {
          label: 'Variant',
          type: 'string',
          description: 'Variant of the product (e.g. Black).'
        },
        location_id: {
          label: 'Location ID',
          type: 'string',
          description: 'The location associated with the item.'
        },
        price: {
          label: 'Price',
          type: 'number',
          description: 'Price of the product being purchased, in units of the specified currency parameter.'
        },
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Item Quantity'
        }
      }
    }
  },
  perform: (request, { payload }) => {
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
            name: 'view_item_list',
            params: {
              item_list_id: payload.item_list_id,
              item_list_name: payload.item_list_name,
              items: googleItems
            }
          }
        ]
      }
    })
  }
}

export default action
