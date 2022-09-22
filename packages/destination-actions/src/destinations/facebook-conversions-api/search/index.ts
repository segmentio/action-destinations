import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES } from '../constants'
import { get_api_version } from '../utils'
import {
  currency,
  value,
  contents,
  validateContents,
  content_ids,
  custom_data,
  event_time,
  action_source,
  content_category,
  event_id,
  event_source_url,
  enable_limited_data_use,
  data_processing_country,
  data_processing_state
} from '../fb-capi-properties'
import { user_data_field, hash_user_data } from '../fb-capi-user-data'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  description: 'Send event when a user searches content or products',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  fields: {
    action_source: { ...action_source, required: true },
    event_time: { ...event_time, required: true },
    user_data: user_data_field,
    content_category: content_category,
    content_ids: content_ids,
    contents: {
      ...contents,
      default: {
        // Segment Products Searched is a single product event
        '@arrayPath': [
          '$.properties',
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
    currency: currency,
    event_id: event_id,
    event_source_url: event_source_url,
    search_string: {
      label: 'Search String',
      description: 'A search query made by a user. This must be a string.',
      type: 'string',
      default: {
        '@path': '$.properties.query'
      }
    },
    value: value,
    custom_data: custom_data,
    enable_limited_data_use: enable_limited_data_use,
    data_processing_country: data_processing_country,
    data_processing_state: data_processing_state
  },
  perform: (request, { payload, settings, features, statsContext }) => {
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

    if (payload.contents) {
      const err = validateContents(payload.contents)
      if (err) throw err
    }

    let data_options
    if (payload.enable_limited_data_use) {
      data_options = ['LDU']
    } else {
      delete payload?.data_processing_country
      delete payload?.data_processing_state
    }

    return request(
      `https://graph.facebook.com/v${get_api_version(features, statsContext)}/${settings.pixelId}/events`,
      {
        method: 'POST',
        json: {
          data: [
            {
              event_name: 'Search',
              event_time: payload.event_time,
              action_source: payload.action_source,
              event_id: payload.event_id,
              event_source_url: payload.event_source_url,
              user_data: hash_user_data({ user_data: payload.user_data }),
              custom_data: {
                ...payload.custom_data,
                currency: payload.currency,
                content_ids: payload.content_ids,
                contents: payload.contents,
                content_category: payload.content_category,
                value: payload.value,
                search_string: payload.search_string
              },
              data_processing_options: data_options,
              data_processing_state: payload?.data_processing_state,
              data_processing_country: payload?.data_processing_country
            }
          ]
        }
      }
    )
  }
}

export default action
