import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES } from '../constants'
import { currency, value, content_name, content_type, contents, num_items, content_ids, event_time, action_source } from '../fb-capi-properties'
import { user_data_field, hash_user_data } from '../fb-capi-user-data'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Send a purchase event to FB',
  fields: {
    value: { ...value, required: true },
    currency: { ...currency, required: true },
    action_source: { ...action_source, required: true },
    content_name: content_name,
    content_type: content_type,
    contents: contents,
    num_items: num_items,
    content_ids: content_ids,
    event_time: { ...event_time, required: true },
    user_data: user_data_field
  },
  perform: (request, { payload, settings }) => {
    // For stage testing, prioritize settings token over env token
    const TOKEN = settings.token ? settings.token : process.env.TOKEN

    if (!CURRENCY_ISO_CODES.has(payload.currency)) {
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

    return request(`https://graph.facebook.com/v11.0/${settings.pixelId}/events?access_token=${TOKEN}`, {
      method: 'POST',
      json: {
        data: [
          {
            event_name: 'Purchase',
            event_time: payload.event_time,
            action_source: payload.action_source,
            user_data: hash_user_data(payload.user_data),
            custom_data: {
              currency: payload.currency,
              value: payload.value,
              content_ids: payload.content_ids,
              content_name: payload.content_name,
              content_type: payload.content_type,
              contents: payload.contents,
              num_items: payload.num_items,
            }
          }
        ]
      }
    })
  }
}

export default action
