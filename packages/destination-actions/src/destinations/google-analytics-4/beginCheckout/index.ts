import { ActionDefinition } from '@segment/actions-core'
import { verifyCurrency, convertTimestamp, formatItems } from '../ga4-functions'
import {
  formatUserProperties,
  user_properties,
  params,
  coupon,
  currency,
  client_id,
  value,
  items_multi_products,
  user_id,
  timestamp_micros,
  engagement_time_msec
} from '../ga4-properties'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Begin Checkout',
  description: 'Send event when a user begins checkout',
  defaultSubscription: 'type = "track" and event = "Checkout Started"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    coupon: { ...coupon, default: { '@path': '$.properties.coupon' } },
    currency: { ...currency },
    // Google does not have anything to map position, url and image url fields (Segment spec) to
    // so will ignore for now
    items: {
      ...items_multi_products,
      required: true
    },
    value: { ...value },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
    params: params
  },
  perform: (request, { payload }) => {
    if (payload.currency) {
      verifyCurrency(payload.currency)
    }

    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        user_id: payload.user_id,
        timestamp_micros: convertTimestamp(payload.timestamp_micros),
        events: [
          {
            name: 'begin_checkout',
            params: {
              coupon: payload.coupon,
              currency: payload.currency,
              items: formatItems(payload.items),
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
