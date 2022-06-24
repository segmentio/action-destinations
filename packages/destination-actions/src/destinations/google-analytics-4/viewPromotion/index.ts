import { ActionDefinition } from '@segment/actions-core'
import { convertTimestamp, formatItems } from '../ga4-functions'
import {
  creative_name,
  creative_slot,
  promotion_id,
  promotion_name,
  client_id,
  user_id,
  minimal_items,
  items_single_products,
  params,
  formatUserProperties,
  user_properties,
  engagement_time_msec,
  timestamp_micros
} from '../ga4-properties'
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
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
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
      ...items_single_products,
      required: true,
      properties: {
        ...minimal_items.properties,
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
      }
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
            name: 'view_promotion',
            params: {
              creative_name: payload.creative_name,
              creative_slot: payload.creative_slot,
              location_id: payload.location_id,
              promotion_id: payload.promotion_id,
              promotion_name: payload.promotion_name,
              items: formatItems(payload.items),
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
