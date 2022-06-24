import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { verifyCurrency, convertTimestamp, formatItems } from '../ga4-functions'
import {
  coupon,
  currency,
  transaction_id,
  value,
  client_id,
  user_id,
  affiliation,
  shipping,
  tax,
  items_multi_products,
  params,
  formatUserProperties,
  user_properties,
  engagement_time_msec,
  timestamp_micros
} from '../ga4-properties'

// https://segment.com/docs/connections/spec/ecommerce/v2/#order-completed
// https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events#purchase
const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Send event when a user completes a purchase',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    affiliation: { ...affiliation },
    coupon: { ...coupon, default: { '@path': '$.properties.coupon' } },
    currency: { ...currency, required: true },
    // Google does not have anything to map position, url and image url fields (Segment spec) to
    // so will ignore for now
    items: {
      ...items_multi_products,
      required: true
    },
    transaction_id: { ...transaction_id, required: true },
    shipping: { ...shipping },
    tax: { ...tax },
    value: { ...value, default: { '@path': '$.properties.total' } },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
    params: params
  },
  perform: (request, { payload }) => {
    verifyCurrency(payload.currency)

    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        user_id: payload.user_id,
        timestamp_micros: convertTimestamp(payload.timestamp_micros),
        events: [
          {
            name: 'purchase',
            params: {
              affiliation: payload.affiliation,
              coupon: payload.coupon,
              currency: payload.currency,
              items: formatItems(payload.items),
              transaction_id: payload.transaction_id,
              shipping: payload.shipping,
              value: payload.value,
              tax: payload.tax,
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
