import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DataStreamParams, DataStreamType, ProductItem } from '../ga4-types'
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
  currency,
  client_id,
  items_single_products,
  user_id,
  engagement_time_msec,
  timestamp_micros,
  data_stream_type,
  app_instance_id,
  ad_user_data_consent,
  ad_personalization_consent
} from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Cart',
  description: 'Send event when a user adds items to a cart',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    data_stream_type: { ...data_stream_type },
    app_instance_id: { ...app_instance_id },
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    currency: { ...currency },
    items: {
      ...items_single_products,
      required: true
    },
    value: { ...value },
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

    let googleItems: ProductItem[] = []

    if (payload.currency) {
      verifyCurrency(payload.currency)
    }

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
          name: 'add_to_cart',
          params: {
            currency: payload.currency,
            items: googleItems,
            value: payload.value,
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
