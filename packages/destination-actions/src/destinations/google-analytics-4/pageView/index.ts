import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  verifyParams,
  verifyUserProps,
  convertTimestamp,
  getMobileStreamParams,
  getWebStreamParams
} from '../ga4-functions'
import {
  formatUserProperties,
  user_properties,
  params,
  user_id,
  client_id,
  engagement_time_msec,
  timestamp_micros,
  data_stream_type,
  app_instance_id
} from '../ga4-properties'
import { DataStreamType } from '../ga4-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page View',
  description: 'Send page view when a user views a page',
  defaultSubscription: 'type = "page"',
  fields: {
    data_stream_type: { ...data_stream_type },
    app_instance_id: { ...app_instance_id },
    clientId: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    page_location: {
      label: 'Page Location',
      type: 'string',
      description: 'The current page URL',
      default: {
        '@path': '$.context.page.url'
      }
    },
    page_referrer: {
      label: 'Page Referrer',
      type: 'string',
      description: 'Previous page URL',
      default: {
        '@path': '$.context.page.referrer'
      }
    },
    user_properties: user_properties,
    page_title: {
      label: 'Page Title',
      type: 'string',
      description: 'The current page title',
      default: {
        '@path': '$.context.page.title'
      }
    },
    engagement_time_msec: engagement_time_msec,
    params: params
  },
  perform: (request, { payload, features, settings }) => {
    const stream_params =
      payload.data_stream_type === DataStreamType.Mobile
        ? getMobileStreamParams(settings.apiSecret, settings.firebaseAppId, payload.app_instance_id)
        : getWebStreamParams(settings.apiSecret, settings.measurementId, payload.clientId)

    if (features && features['actions-google-analytics-4-verify-params-feature']) {
      verifyParams(payload.params)
      verifyUserProps(payload.user_properties)
    }
    const request_object: { [key: string]: unknown } = {
      ...stream_params.identifier,
      user_id: payload.user_id,
      events: [
        {
          name: 'page_view',
          params: {
            page_location: payload.page_location,
            page_referrer: payload.page_referrer,
            page_title: payload.page_title,
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
    // Firebase App ID can contain colons(:) and they should not be encoded. Hence, interpolating search params to url string instead of passing them as search_params
    return request(`https://www.google-analytics.com/mp/collect?${stream_params.search_params}`, {
      method: 'POST',
      json: request_object
    })
  }
}

export default action
