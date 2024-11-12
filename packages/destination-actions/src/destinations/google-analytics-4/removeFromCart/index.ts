import { ActionDefinition, ErrorCodes, IntegrationError, PayloadValidationError } from '@segment/actions-core'
import {
  verifyCurrency,
  verifyParams,
  verifyUserProps,
  convertTimestamp,
  getMobileStreamParams,
  getWebStreamParams,
  sendData,
  formatConsent
} from '../ga4-functions'
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
  timestamp_micros,
  app_instance_id,
  data_stream_type,
  ad_user_data_consent,
  ad_personalization_consent
} from '../ga4-properties'
import { DataStreamParams, DataStreamType, ProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove from Cart',
  description: 'Send event when a user removes items from a cart',
  defaultSubscription: 'type = "track" and event = "Product Removed"',
  fields: {
    data_stream_type: { ...data_stream_type },
    app_instance_id: { ...app_instance_id },
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
    params: params,
    ad_user_data_consent: ad_user_data_consent,
    ad_personalization_consent: ad_personalization_consent
  },
  perform: (request, { payload, settings }) => {
    const data_stream_type = payload.data_stream_type ?? DataStreamType.Web
    const stream_params: DataStreamParams =
      data_stream_type === DataStreamType.MobileApp
        ? getMobileStreamParams(settings.apiSecret, settings.firebaseAppId, payload.app_instance_id)
        : getWebStreamParams(settings.apiSecret, settings.measurementId, payload.client_id)

    if (payload.currency) {
      verifyCurrency(payload.currency)
    }

    // Google requires that currency be included at the event level if value is included.
    if (payload.value && payload.currency === undefined) {
      throw new IntegrationError('Currency is required if value is set.', ErrorCodes.INVALID_CURRENCY_CODE, 400)
    }

    /**
     * Google requires a currency be specified either at the event level or the item level.
     * If set at the event level, item-level currency is ignored. If event-level currency is not set then
     * currency from the first item in items is used.
     */
    if (payload.currency === undefined && (!payload.items || !payload.items[0] || !payload.items[0].currency)) {
      throw new PayloadValidationError('One of item-level currency or top-level currency is required.')
    }

    let googleItems: ProductItem[] = []

    if (payload.items) {
      googleItems = payload.items.map((product) => {
        if (product.item_name === undefined && product.item_id === undefined) {
          throw new PayloadValidationError(
            'One of product name or product id is required for product or impression data.'
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

    const request_object: { [key: string]: unknown } = {
      ...stream_params.identifier,
      user_id: payload.user_id,
      events: [
        {
          name: 'remove_from_cart',
          params: {
            currency: payload.currency,
            value: payload.value,
            items: googleItems,
            engagement_time_msec: payload.engagement_time_msec,
            ...payload.params
          }
        }
      ],
      ...formatUserProperties(payload.user_properties),
      timestamp_micros: convertTimestamp(payload.timestamp_micros),
      ...formatConsent({
        ad_personalization_consent: payload.ad_personalization_consent,
        ad_user_data_consent: payload.ad_user_data_consent
      })
    }

    return sendData(request, stream_params.search_params, request_object)
  }
}

export default action
