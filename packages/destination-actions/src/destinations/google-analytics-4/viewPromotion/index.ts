import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { PromotionProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

/**
 * Following GA4 View Promotion Spec at:
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events#view_promotion
 */
const action: ActionDefinition<Settings, Payload> = {
  title: 'View Promotion',
  description: 'Send view promotion events to GA4 to make the most of the ecommerce reports in Google Analytics',
  defaultSubscription: 'type = "track" and event = "Promotion Viewed"',
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
    creative_name: {
      label: 'Creative Name',
      type: 'string',
      description: 'The name of the promotional creative.'
    },
    creative_slot: {
      label: 'Creative Slot',
      type: 'string',
      description: 'The name of the promotional creative slot associated with the event.',
      default: {
        '@path': '$.properties.creative'
      }
    },
    location_id: {
      label: 'Location ID',
      type: 'string',
      description: 'The ID of the location.',
      default: {
        '@path': '$.properties.position'
      }
    },
    promotion_id: {
      label: 'Promotion ID',
      type: 'string',
      description: 'The ID of the promotion associated with the event.',
      default: {
        '@path': '$.properties.promotion_id'
      }
    },
    promotion_name: {
      label: 'Promotion Name',
      type: 'string',
      description: 'The name of the promotion associated with the event.',
      default: {
        '@path': '$.properties.name'
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
        creative_name: {
          label: 'Creative Name',
          type: 'string',
          description: 'The name of the promotional creative.'
        },
        creative_slot: {
          label: 'Creative Slot',
          type: 'string',
          description: 'The name of the promotional creative slot associated with the item.'
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
        promotion_id: {
          label: 'Promotion ID',
          type: 'string',
          description: 'The ID of the promotion associated with the item.'
        },
        promotion_name: {
          label: 'Promotion Name',
          type: 'string',
          description: 'The name of the promotion associated with the item.'
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
    let googleItems: PromotionProductItem[] = []

    if (payload.items) {
      googleItems = payload.items.map((product) => {
        if (product.item_name === undefined && product.item_id === undefined) {
          throw new IntegrationError('One of item id or item name is required.', 'Misconfigured required field', 400)
        }

        if (product.currency && !CURRENCY_ISO_CODES.includes(product.currency)) {
          throw new IntegrationError(`${product.currency} is not a valid currency code.`, 'Incorrect value format', 400)
        }

        return product as PromotionProductItem
      })
    }

    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        events: [
          {
            name: 'view_promotion',
            params: {
              creative_name: payload.creative_name,
              creative_slot: payload.creative_slot,
              location_id: payload.location_id,
              promotion_id: payload.promotion_id,
              promotion_name: payload.promotion_name,
              items: googleItems
            }
          }
        ]
      }
    })
  }
}

export default action
