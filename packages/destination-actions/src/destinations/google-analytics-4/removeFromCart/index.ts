import { ActionDefinition } from '@segment/actions-core'
import { verifyCurrency, convertTimestamp, formatItems, checkCurrencyDefinition } from '../ga4-functions'
import {
  formatUserProperties,
  user_properties,
  params,
  value,
  user_id,
  client_id,
  currency,
  items_single_products,
  engagement_time_msec,
  timestamp_micros
} from '../ga4-properties'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove from Cart',
  description: 'Send event when a user removes items from a cart',
  defaultSubscription: 'type = "track" and event = "Product Removed"',
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

    checkCurrencyDefinition(payload.value, payload.currency, payload.items)

    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        user_id: payload.user_id,
        timestamp_micros: convertTimestamp(payload.timestamp_micros),
        events: [
          {
            name: 'remove_from_cart',
            params: {
              currency: payload.currency,
              value: payload.value,
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
