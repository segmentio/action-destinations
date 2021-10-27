import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { action_source, contents, content_category, content_ids, content_name, content_type, currency, event_id, event_source_url, event_time, value } from '../fb-capi-properties'
import { user_data_field, hash_user_data } from '../fb-capi-user-data'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES, API_VERSION } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'View Content',
  description: 'Send a view content event to FB',
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  fields: {
    user_data: user_data_field,
    event_time: { ...event_time, required: true },
    action_source: { ...action_source, required: true },
    event_id: event_id,
    event_source_url: event_source_url,
    content_ids: content_ids,
    content_category: content_category,
    content_name: content_name,
    content_type: content_type,
    contents: contents,
    currency: currency,
    value: value
  },
  perform: (request, { payload, settings}) => {
    // For stage testing, prioritize settings token over env token
    const TOKEN = settings.token ? settings.token : process.env.TOKEN

    if (payload.currency && !CURRENCY_ISO_CODES.has(payload.currency)) {
      throw new IntegrationError(
        `${payload.currency} is not a valid currency code.`,
        'Misconfigured required field',
        400
      )
    }

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

    
    return request(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}/events?access_token=${TOKEN}`, {
      method: 'POST',
      json: {
        data: [
          {
            event_name: 'ViewContent',
            event_time: payload.event_time,
            action_source: payload.action_source,
            event_id: payload.event_id,
            event_source_url: payload.event_source_url,
            user_data: hash_user_data({user_data: payload.user_data}),
            custom_data: {
              currency: payload.currency,
              value: payload.value,
              content_ids: payload.content_ids,
              content_name: payload.content_name,
              content_type: payload.content_type,
              contents: payload.contents
            }
          }
        ]
      }
    })
  }
}

export default action
