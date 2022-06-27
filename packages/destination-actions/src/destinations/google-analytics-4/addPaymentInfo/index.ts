import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { verifyCurrency, verifyParams, convertTimestamp, formatItems, checkCurrencyDefinition } from '../ga4-functions'
import {
  user_id,
  formatUserProperties,
  user_properties,
  client_id,
  currency,
  value,
  coupon,
  payment_type,
  items_multi_products,
  engagement_time_msec,
  timestamp_micros,
  params
} from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Payment Info',
  description: 'Send event when a user submits their payment information',
  defaultSubscription: 'type = "track" and event = "Payment Info Entered"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    currency: { ...currency },
    value: { ...value },
    coupon: { ...coupon },
    payment_type: { ...payment_type },
    items: {
      ...items_multi_products,
      required: true
    },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
    params: params
  },
  perform: (request, { payload }) => {
    // Google requires that `add_payment_info` events include an array of products: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
    // This differs from the Segment spec, which doesn't require a products array: https://segment.com/docs/connections/spec/ecommerce/v2/#payment-info-entered
    if (payload.items && !payload.items.length) {
      throw new IntegrationError(
        'Google requires one or more products in add_payment_info events.',
        'Misconfigured required field',
        400
      )
    }

    if (payload.currency) {
      verifyCurrency(payload.currency)
    }

    checkCurrencyDefinition(payload.value, payload.currency, payload.items)

    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        user_id: payload.user_id,
        timestamp_micros: convertTimestamp(payload.timestamp_micros),
        events: [
          {
            name: 'add_payment_info',
            params: {
              currency: payload.currency,
              value: payload.value,
              coupon: payload.coupon,
              payment_type: payload.payment_type,
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
