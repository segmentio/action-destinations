import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import {
  action_source,
  custom_data,
  event_id,
  event_source_url,
  event_time,
  data_processing_options,
  data_processing_options_country,
  data_processing_options_state
} from '../fb-capi-properties'
import { hash_user_data, user_data_field } from '../fb-capi-user-data'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { get_api_version } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Send a custom event',
  fields: {
    action_source: { ...action_source, required: true },
    event_name: {
      label: 'Event Name',
      description:
        'A Facebook [standard event](https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking#standard-events) or [custom event](https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking#custom-events) name.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    event_time: { ...event_time, required: true },
    user_data: user_data_field,
    custom_data: custom_data,
    event_id: event_id,
    event_source_url: event_source_url,
    data_processing_options: data_processing_options,
    data_processing_options_country: data_processing_options_country,
    data_processing_options_state: data_processing_options_state
  },
  perform: (request, { payload, settings, features, statsContext }) => {
    if (!payload.user_data) {
      throw new IntegrationError('Must include at least one user data property', 'Misconfigured required field', 400)
    }

    let data_options, country_code, state_code
    if (payload.data_processing_options) {
      data_options = ['LDU']
      country_code = payload.data_processing_options_country ? payload.data_processing_options_country : 0
      state_code = payload.data_processing_options_state ? payload.data_processing_options_state : 0
    }

    return request(
      `https://graph.facebook.com/v${get_api_version(features, statsContext)}/${settings.pixelId}/events`,
      {
        method: 'POST',
        json: {
          data: [
            {
              event_name: payload.event_name,
              event_time: payload.event_time,
              action_source: payload.action_source,
              event_id: payload.event_id,
              event_source_url: payload.event_source_url,
              user_data: hash_user_data({ user_data: payload.user_data }),
              custom_data: payload.custom_data,
              data_processing_options: data_options,
              data_processing_options_country: country_code,
              data_processing_options_state: state_code
            }
          ]
        }
      }
    )
  }
}

export default action
