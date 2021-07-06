import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Select Promotion',
  description: 'Send select promotion events to GA4 to make the most of the ecommerce reports in Google Analytics',
  defaultSubscription: 'type = "track" and event = "Promotion Clicked"',
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
    location_id: {
      label: 'Location ID',
      type: 'string',
      description: 'The ID of the location.'
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
        promotion_id: {
          label: 'Promotion ID',
          type: 'string',
          description: 'The ID of a product promotion.'
        },
        promotion_name: {
          label: 'Promotion Name',
          type: 'string',
          description: 'The name of a product promotion.'
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
        creative_name: {
          label: 'Creative Name',
          type: 'string',
          description: 'The name of a creative used in a promotional spot.'
        },
        creative_slot: {
          label: 'Creative Slot',
          type: 'string',
          description: 'The name of a creative slot.'
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
        location_id: {
          label: 'Location ID',
          type: 'string',
          description:
            'The location associated with the event. If possible, set to the Google Place ID that corresponds to the associated item. Can also be overridden to a custom location ID string.'
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

        if (product.promotion_id === undefined && product.promotion_name === undefined) {
          throw new IntegrationError(
            'One of promotion name or promotion id is required.',
            'Misconfigured required field',
            400
          )
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
            name: 'select_promotion',
            params: {
              location_id: payload.location_id,
              items: googleItems
            }
          }
        ]
      }
    })
  }
}

export default action
