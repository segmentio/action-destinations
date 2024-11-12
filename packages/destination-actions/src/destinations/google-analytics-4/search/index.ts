import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
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
  user_id,
  client_id,
  engagement_time_msec,
  timestamp_micros,
  app_instance_id,
  data_stream_type,
  ad_user_data_consent,
  ad_personalization_consent
} from '../ga4-properties'
import { DataStreamParams, DataStreamType } from '../ga4-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  description: 'Send event when a user searches your content',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  fields: {
    data_stream_type: { ...data_stream_type },
    app_instance_id: { ...app_instance_id },
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    search_term: {
      label: 'Search Term',
      type: 'string',
      description: 'The term that was searched for.',
      required: true,
      default: {
        '@path': `$.properties.query`
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

    verifyParams(payload.params)
    verifyUserProps(payload.user_properties)

    const request_object: { [key: string]: unknown } = {
      ...stream_params.identifier,
      user_id: payload.user_id,
      events: [
        {
          name: 'search',
          params: {
            search_term: payload.search_term,
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
