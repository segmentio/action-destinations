import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { action_source, event_id, event_source_url, event_time } from '../fb-capi-properties'
import { hash_user_data, user_data_field } from '../fb-capi-user-data'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_VERSION } from '../constants'
const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom',
  description: 'Track your own custom events.',
  defaultSubscription: 'type = "identify"',
  fields: {
    action_source: { ...action_source, required: true},
    event_name: {
      label: 'Event Name',
      description: 'A Facebook pixel Standard Event or Custom Event name.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    event_time: { ...event_time, required: true },
    user_data: user_data_field,
    event_id: event_id,
    event_source_url: event_source_url,
  },
  perform: (request, { payload, settings }) => {
    const TOKEN = settings.token ? settings.token : process.env.TOKEN

    if (!payload.user_data) {
      throw new IntegrationError('Must include at least one user data property', 'Misconfigured required field', 400)
    }

    if (
      !['email', 'website', 'phone_call', 'chat', 'physical_store', 'system_generated', 'other']
        .includes(payload.action_source)
    ) {
      throw new IntegrationError('Provide a valid value for the action source parameter, such as "website"', 'Misconfigured required field', 400)
    }

    return request(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}/events?access_token=${TOKEN}`, {
      method: 'POST',
      json: {
        data: [
          {
            event_name: payload.event_name,
            event_time: payload.event_time,
            action_source: payload.action_source,
            event_id: payload.event_id,
            event_source_url: payload.event_source_url,
            user_data: hash_user_data(payload.user_data)
          }
        ]
      }
    })
  }
}

export default action
