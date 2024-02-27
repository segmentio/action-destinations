import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { verifyCurrency, verifyParams, verifyUserProps, convertTimestamp } from '../ga4-functions'
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

    // Google requires that currency be included at the event level if value is included.
    if (payload.value && payload.currency === undefined) {
      throw new IntegrationError('Currency is required if value is set.', 'Misconfigured required field', 400)
    }

    /**
     * Google requires a currency be specified either at the event level or the item level.
     * If set at the event level, item-level currency is ignored. If event-level currency is not set then
     * currency from the first item in items is used.
     */
    if (payload.currency === undefined && payload.items[0].currency === undefined) {
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
          name: 'add_payment_info',
          params: {
            currency: payload.currency,
            value: payload.value,
            coupon: payload.coupon,
            payment_type: payload.payment_type,
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
