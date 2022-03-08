import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES, API_VERSION } from '../constants'
import {
  currency,
  value,
  content_name,
  content_type,
  contents,
  validateContents,
  custom_data,
  num_items,
  content_ids,
  event_time,
  action_source,
  event_source_url,
  event_id
} from '../fb-capi-properties'
import { user_data_field, hash_user_data } from '../fb-capi-user-data'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Send event when a user completes a purchase',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    action_source: { ...action_source, required: true },
    currency: { ...currency, required: true },
    event_time: { ...event_time, required: true },
    user_data: user_data_field,
    value: {
      ...value,
      required: true,
      default: { '@path': '$.properties.revenue' }
    },
    content_ids: content_ids,
    content_name: content_name,
    content_type: content_type,
    contents: {
      // Segment Checkout Started has an array of products mapping
      ...contents,
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            id: {
              '@path': '$.product_id'
            },
            quantity: {
              '@path': '$.quantity'
            },
            item_price: {
              '@path': '$.price'
            }
          }
        ]
      }
    },
    event_id: event_id,
    event_source_url: event_source_url,
    num_items: num_items,
    custom_data: custom_data
  },
  perform: (request, { payload, settings }) => {
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

    if (payload.contents) {
      const err = validateContents(payload.contents)
      if (err) throw err
    }

    return request(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}/events`, {
      method: 'POST',
      json: {
        data: [
          {
            event_name: 'Purchase',
            event_time: payload.event_time,
            action_source: payload.action_source,
            event_source_url: payload.event_source_url,
            event_id: payload.event_id,
            user_data: hash_user_data({ user_data: payload.user_data }),
            custom_data: {
              ...payload.custom_data,
              currency: payload.currency,
              value: payload.value,
              content_ids: payload.content_ids,
              content_name: payload.content_name,
              content_type: payload.content_type,
              contents: payload.contents,
              num_items: payload.num_items
            }
          }
        ]
      }
    })
  }
}

export default action
