import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { verifyCurrency, verifyParams, verifyUserProps, convertTimestamp } from '../ga4-functions'
import {
  formatUserProperties,
  user_properties,
  params,
  value,
  currency,
  client_id,
  items_single_products,
  user_id,
  engagement_time_msec,
  timestamp_micros
} from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Wishlist',
  description: 'Send event when a user adds items to a wishlist',
  defaultSubscription: 'type = "track" and event = "Product Added to Wishlist"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    currency: { ...currency },
    value: { ...value },
    items: {
      ...items_single_products,
      required: true
    },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
    params: params
  },
  perform: (request, { payload }) => {
    if (payload.currency) {
      verifyCurrency(payload.currency)
    }

    // Google requires that currency be included at the event level if value is included.
    if (payload.value && payload.currency === undefined) {
      throw new IntegrationError('Currency is required if value is set.', 'Misconfigured required field', 400)
    }

    /**
     * Google requires a currency be specified either at the event level or the item level.
     * If set at the event level, item-level currency is ignored. If event-level currency is not set then
     * currency from the first item in items is used.
     */
    if (payload.currency === undefined && (!payload.items || !payload.items[0] || !payload.items[0].currency)) {
      throw new IntegrationError(
        'One of item-level currency or top-level currency is required.',
        'Misconfigured required field',
        400
      )
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
        if (product.currency) {
          verifyCurrency(product.currency)
        }

        return product as ProductItem
      })
    }

    verifyParams(payload.params)
    verifyUserProps(payload.user_properties)

    const request_object: { [key: string]: any } = {
      client_id: payload.client_id,
      user_id: payload.user_id,
      events: [
        {
          name: 'add_to_wishlist',
          params: {
            currency: payload.currency,
            value: payload.value,
            items: googleItems,
            engagement_time_msec: payload.engagement_time_msec,
            ...payload.params
          }
        }
      ],
      ...formatUserProperties(payload.user_properties),
      timestamp_micros: convertTimestamp(payload.timestamp_micros)
    }

    return request('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app/v2/consolidated-data', {
      method: 'POST',
      json: request_object
    })
  }
}

export default action
