import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { verifyCurrency, verifyParams, verifyUserProps, convertTimestamp } from '../ga4-functions'
import {
  coupon,
  transaction_id,
  client_id,
  user_id,
  currency,
  value,
  affiliation,
  shipping,
  items_multi_products,
  params,
  formatUserProperties,
  user_properties,
  engagement_time_msec,
  timestamp_micros
} from '../ga4-properties'
import { ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Refund',
  description: 'Send event when a refund is issued',
  defaultSubscription: 'type = "track" and event = "Order Refunded"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    currency: { ...currency },
    transaction_id: { ...transaction_id, required: true },
    value: { ...value, default: { '@path': '$.properties.total' } },
    affiliation: { ...affiliation },
    coupon: { ...coupon },
    shipping: { ...shipping },
    tax: {
      label: 'Tax',
      type: 'number',
      description: 'Tax cost associated with a transaction.'
    },
    items: {
      ...items_multi_products
    },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
    params: params
  },
  perform: (request, { payload }) => {
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
    if (payload.currency === undefined && (!payload.items || !payload.items[0] || !payload.items[0].currency)) {
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
          name: 'refund',
          params: {
            currency: payload.currency,
            transaction_id: payload.transaction_id,
            value: payload.value,
            affiliation: payload.affiliation,
            coupon: payload.coupon,
            shipping: payload.shipping,
            tax: payload.tax,
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
