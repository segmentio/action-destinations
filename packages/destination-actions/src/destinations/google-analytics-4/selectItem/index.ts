import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { client_id, items_single_products } from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Select Item',
  description: 'Send event when a user selects an item from a list',
  defaultSubscription: 'type = "track" and event = "Product Clicked"',
  fields: {
    client_id: { ...client_id },
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
      ...items_single_products,
      required: true
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
