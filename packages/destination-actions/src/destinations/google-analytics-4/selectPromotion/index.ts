import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
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
  creative_name,
  client_id,
  user_id,
  creative_slot,
  promotion_id,
  promotion_name,
  minimal_items,
  items_single_products,
  params,
  formatUserProperties,
  user_properties,
  engagement_time_msec,
  timestamp_micros,
  app_instance_id,
  data_stream_type,
  ad_user_data_consent,
  ad_personalization_consent
} from '../ga4-properties'
import { DataStreamParams, DataStreamType, PromotionProductItem } from '../ga4-types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Select Promotion',
  description: 'Send event when a user selects a promotion',
  defaultSubscription: 'type = "track" and event = "Promotion Clicked"',
  fields: {
    data_stream_type: { ...data_stream_type },
    app_instance_id: { ...app_instance_id },
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    creative_name: { ...creative_name },
    creative_slot: { ...creative_slot, default: { '@path': '$.properties.creative' } },
    location_id: {
      label: 'Location ID',
      type: 'string',
      description: 'The ID of the location.'
    },
    promotion_id: { ...promotion_id, default: { '@path': '$.properties.promotion_id' } },
    promotion_name: { ...promotion_name, default: { '@path': '$.properties.name' } },
    items: {
      ...items_single_products,
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

    let googleItems: PromotionProductItem[] = []

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

        return product as PromotionProductItem
      })
    }

    verifyParams(payload.params)
    verifyUserProps(payload.user_properties)

    const request_object: { [key: string]: unknown } = {
      ...stream_params.identifier,
      user_id: payload.user_id,
      events: [
        {
          name: 'select_promotion',
          params: {
            creative_name: payload.creative_name,
            creative_slot: payload.creative_slot,
            location_id: payload.location_id,
            promotion_id: payload.promotion_id,
            promotion_name: payload.promotion_name,
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
