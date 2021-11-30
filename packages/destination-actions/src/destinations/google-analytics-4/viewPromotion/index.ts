import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { creative_name, creative_slot, promotion_id, promotion_name, client_id, items } from '../ga4-properties'
import { PromotionProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

/**
 * Following GA4 View Promotion Spec at:
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events#view_promotion
 */
const action: ActionDefinition<Settings, Payload> = {
  title: 'View Promotion',
  description: 'Send event when a promotion is shown to a user',
  defaultSubscription: 'type = "track" and event = "Promotion Viewed"',
  fields: {
    client_id: { ...client_id, required: true },
    creative_name: { ...creative_name },
    creative_slot: { ...creative_slot, default: { '@path': '$.properties.creative' } },
    location_id: {
      label: 'Location ID',
      type: 'string',
      description: 'The ID of the location.',
      default: {
        '@path': '$.properties.position'
      }
    },
    promotion_id: { ...promotion_id, default: { '@path': '$.properties.promotion_id' } },
    promotion_name: { ...promotion_name, default: { '@path': '$.properties.name' } },
    items: {
      ...items,
      required: true,
      properties: {
        ...items.properties,
        creative_name: {
          ...creative_name
        },
        creative_slot: {
          ...creative_slot
        },
        promotion_name: {
          ...promotion_name
        },
        promotion_id: {
          ...promotion_id
        }
      },
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
