import { ActionDefinition } from '@segment/actions-core'
import { convertTimestamp, formatItems } from '../ga4-functions'
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
  perform: (request, { payload }) => {
    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        user_id: payload.user_id,
        timestamp_micros: convertTimestamp(payload.timestamp_micros),
        events: [
          {
            name: 'select_item',
            params: {
              items: formatItems(payload.items),
              item_list_name: payload.item_list_name,
              item_list_id: payload.item_list_id,
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
