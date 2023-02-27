import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  verifyParams,
  verifyUserProps,
  convertTimestamp,
  getMobileStreamParams,
  getWebStreamParams,
  sendData
} from '../ga4-functions'

import {
  formatUserProperties,
  user_properties,
  params,
  client_id,
  user_id,
  engagement_time_msec,
  timestamp_micros,
  data_stream_type,
  app_instance_id
} from '../ga4-properties'
import { DataStreamParams, DataStreamType } from '../ga4-types'

const normalizeEventName = (name: string, lowercase: boolean | undefined): string => {
  name = name.trim()
  name = name.replace(/\s/g, '_')

  if (lowercase) {
    name = name.toLowerCase()
  }
  return name
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Send any custom event',
  defaultSubscription: 'type = "track"',
  fields: {
    data_stream_type: { ...data_stream_type },
    app_instance_id: { ...app_instance_id },
    clientId: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    name: {
      label: 'Event Name',
      description:
        'The unique name of the custom event created in GA4. GA4 does not accept spaces in event names so Segment will replace any spaces with underscores. More information about GA4 event name rules is available in [their docs](https://support.google.com/analytics/answer/10085872?hl=en&ref_topic=9756175#event-name-rules&zippy=%2Cin-this-article.%2Cin-this-article).',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    lowercase: {
      label: 'Lowercase Event Name',
      description:
        'If true, the event name will be converted to lowercase before sending to Google. Event names are case sensitive in GA4 so enable this setting to avoid distinct events for casing differences. More information about GA4 event name rules is available in [their docs](https://support.google.com/analytics/answer/10085872?hl=en&ref_topic=9756175#event-name-rules&zippy=%2Cin-this-article.%2Cin-this-article).',
      type: 'boolean',
      default: false
    },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
    params: { ...params }
  },
  perform: (request, { payload, features, settings }) => {
    const data_stream_type = payload.data_stream_type ?? DataStreamType.Web
    const stream_params: DataStreamParams =
      data_stream_type === DataStreamType.MobileApp
        ? getMobileStreamParams(settings.apiSecret, settings.firebaseAppId, payload.app_instance_id)
        : getWebStreamParams(settings.apiSecret, settings.measurementId, payload.clientId)

    const event_name = normalizeEventName(payload.name, payload.lowercase)

    if (features && features['actions-google-analytics-4-verify-params-feature']) {
      verifyParams(payload.params)
      verifyUserProps(payload.user_properties)
    }

    const request_object: { [key: string]: unknown } = {
      ...stream_params.identifier,
      user_id: payload.user_id,
      events: [
        {
          name: event_name,
          params: {
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

    return sendData(request, stream_params.search_params, request_object)
  }
}
export default action
