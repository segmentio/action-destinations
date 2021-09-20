import  { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { action_source, event_time } from '../fb-capi-properties'
import { user_data_field, hash_user_data } from '../fb-capi-user-data'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page View',
  description: 'Send a page view event to FB',
  defaultSubscription: 'type = "page"',
  fields: {
    user_data: user_data_field,
    action_source: { ...action_source, required: true },
    event_time: { ...event_time, required: true }
  },
  perform: (request, { payload, settings }) => {
    // For stage testing, prioritize settings token over env token
    const TOKEN = settings.token ? settings.token : process.env.TOKEN

    if (!payload.user_data) {
      throw new IntegrationError('Must include at least one user data property', 'Misconfigured required field', 400)
    }

    if (payload.action_source === 'website' && payload.user_data.client_user_agent === undefined) {
      throw new IntegrationError(
        'If action source is "Website" then client_user_agent must be defined',
        'Misconfigured required field',
        400
      )
    }
    return request(`https://graph.facebook.com/v11.0/${settings.pixelId}/events?access_token=${TOKEN}`, {
      method: 'POST',
      json: {
        data: [
          {
            event_name: 'PageView',
            event_time: payload.event_time,
            action_source: payload.action_source,
            user_data: hash_user_data(payload.user_data)
          }
        ]
      }
    })
  }
}

export default action
