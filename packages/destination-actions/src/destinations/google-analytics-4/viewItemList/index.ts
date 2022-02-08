import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { params, user_id, client_id, items_multi_products } from '../ga4-properties'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

/**
 * Follows Google Analytics spec at:
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events#view_item_list
 */
const action: ActionDefinition<Settings, Payload> = {
  title: 'View Item List',
  description: 'Send event when a user views a list of items or offerings',
  defaultSubscription: 'type = "track" and event = "Product List Viewed"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
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
      ...items_multi_products,
      required: true
    },
    params: params
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
        user_id: payload.user_id,
        events: [
          {
            name: 'view_item_list',
            params: {
              item_list_id: payload.item_list_id,
              item_list_name: payload.item_list_name,
              items: googleItems,
              ...payload.params
            }
          }
        ]
      }
    })
  }
}

export default action
