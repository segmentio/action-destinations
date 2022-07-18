import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { verifyCurrency, verifyParams, verifyUserProps, convertTimestamp } from '../ga4-functions'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  formatUserProperties,
  user_properties,
  params,
  user_id,
  client_id,
  items_single_products,
  engagement_time_msec,
  timestamp_micros
} from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Select Item',
  description: 'Send event when a user selects an item from a list',
  defaultSubscription: 'type = "track" and event = "Product Clicked"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
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
    },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
    params: params
  },
  perform: (request, { payload, features }) => {
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

    if (features && features['actions-google-analytics-4-verify-params-feature']) {
      verifyParams(payload.params)
      verifyUserProps(payload.user_properties)
    }
    const request_object: { [key: string]: any } = {
      client_id: payload.client_id,
      user_id: payload.user_id,
      events: [
        {
          name: 'select_item',
          params: {
            items: googleItems,
            item_list_name: payload.item_list_name,
            item_list_id: payload.item_list_id,
            engagement_time_msec: payload.engagement_time_msec,
            ...payload.params
          }
        }
      ],
      ...formatUserProperties(payload.user_properties)
    }

    if (features && features['actions-google-analytics-4-add-timestamp']) {
      request_object.timestamp_micros = convertTimestamp(payload.timestamp_micros)
    }

    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: request_object
    })
  }
}

export default action
