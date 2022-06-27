import { ActionDefinition } from '@segment/actions-core'
import { verifyParams, convertTimestamp, formatItems } from '../ga4-functions'
import {
  formatUserProperties,
  user_properties,
  params,
  user_id,
  client_id,
  items_multi_products,
  engagement_time_msec,
  timestamp_micros
} from '../ga4-properties'
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
    timestamp_micros: { ...timestamp_micros },
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
            name: 'view_item_list',
            params: {
              item_list_id: payload.item_list_id,
              item_list_name: payload.item_list_name,
              items: formatItems(payload.items),
              engagement_time_msec: payload.engagement_time_msec,
              ...verifyParams(payload.params)
            }
          }
        ],
        ...formatUserProperties(payload.user_properties)
      }
    })
  }
}

export default action
