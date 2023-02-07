import { ActionDefinition, MisconfiguredFieldError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { verifyCurrency, verifyParams, verifyUserProps, convertTimestamp } from '../ga4-functions'
import { ProductItem } from '../ga4-types'
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
  perform: (request, { payload, features }) => {
    verifyCurrency(payload.currency)

    let googleItems: ProductItem[] = []

    if (payload.items) {
      googleItems = payload.items.map((product) => {
        if (product.item_name === undefined && product.item_id === undefined) {
          throw new MisconfiguredFieldError(
            'One of product name or product id is required for product or impression data.'
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
          name: 'purchase',
          params: {
            affiliation: payload.affiliation,
            coupon: payload.coupon,
            currency: payload.currency,
            items: googleItems,
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
