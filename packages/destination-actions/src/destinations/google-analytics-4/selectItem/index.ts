import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Select Item',
  description: 'Send select item events to GA4 to make the most of the ecommerce reports in Google Analytics',
  defaultSubscription: 'type = "track" and event = "Product Clicked"',
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
    item_list_name: {
      label: 'Item List Name',
      description: 'The name of the list in which the item was presented to the user.',
      type: 'string'
    },
    item_list_id: {
      label: 'Item List Id',
      description: 'The ID of the list in which the item was presented to the user.',
      type: 'string'
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
          description: 'The index of the item in a list.'
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
        item_category2: {
          label: 'Category2',
          type: 'string',
          description: 'The second category of the product.'
        },
        item_category3: {
          label: 'Category3',
          type: 'string',
          description: 'The third category of the product.'
        },
        item_category4: {
          label: 'Category4',
          type: 'string',
          description: 'The fourth category of the product.'
        },
        item_category5: {
          label: 'Category5',
          type: 'string',
          description: 'The fifth category of the product.'
        },
        item_list_id: {
          label: 'Item List Name',
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
          type: 'integer',
          description: 'Item quantity.'
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
            name: 'select_item',
            params: {
              items: googleItems,
              item_list_name: payload.item_list_name,
              item_list_id: payload.item_list_id
            }
          }
        ]
      }
    })
  }
}

export default action
