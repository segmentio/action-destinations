import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ProductItem } from '../ga4-types'
import { CURRENCY_ISO_CODES } from '../constants'
import {
  formatUserProperties,
  user_properties,
  params,
  value,
  currency,
  client_id,
  items_single_products,
  user_id,
  engagement_time_msec
} from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Cart',
  description: 'Send event when a user adds items to a cart',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    currency: { ...currency },
    items: {
      ...items_single_products,
      required: true
    },
    value: { ...value },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
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
            name: 'add_to_cart',
            params: {
              currency: payload.currency,
              items: googleItems,
              value: payload.value,
              engagement_time_msec: payload.engagement_time_msec,
              ...payload.params
            }
          }
        ],
        ...formatUserProperties(payload.user_properties)
      }
    })
  }
}

export default action
