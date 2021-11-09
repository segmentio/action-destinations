import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { content_ids, content_name, content_type, contents, currency, value, action_source, event_time, event_source_url, event_id } from '../fb-capi-properties'
import { CURRENCY_ISO_CODES, API_VERSION } from '../constants'
import { hash_user_data, user_data_field } from '../fb-capi-user-data'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Cart',
  description: 'Send an add to cart event to FB',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    action_source: { ...action_source, required: true },
    event_time: { ...event_time, required: true },
    user_data: user_data_field,
    content_ids: content_ids,
    content_name: content_name,
    content_type: content_type,
    contents: { ...contents, default: undefined },
    currency: currency,
    event_id: event_id,
    event_source_url: event_source_url,
    value: value
  },
  perform: (request, { payload, settings }) => {
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

    return request(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}/events`, {
      method: 'POST',
      json: {
        data: [
          {
            event_name: 'AddToCart',
            event_time: payload.event_time,
            event_source_url: payload.event_source_url,
            event_id: payload.event_id,
            action_source: payload.action_source,
            user_data: hash_user_data({user_data: payload.user_data}),
            custom_data: {
              currency: payload.currency,
              value: payload.value,
              content_ids: payload.content_ids,
              content_name: payload.content_name,
              contents: payload.contents,
              content_type: payload.content_type
            }
          }
        ]
      }
    })
  }
}

export default action
