import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  content_ids,
  content_name,
  content_type,
  contents,
  validateContents,
  currency,
  value,
  action_source,
  event_time,
  event_source_url,
  event_id,
  custom_data,
  data_processing_options,
  data_processing_options_country,
  data_processing_options_state,
  dataProcessingOptions
} from '../fb-capi-properties'
import { CURRENCY_ISO_CODES } from '../constants'
import { hash_user_data, user_data_field } from '../fb-capi-user-data'
import { get_api_version } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Cart',
  description: 'Send event when a user adds a product to the shopping cart',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    action_source: { ...action_source, required: true },
    event_time: { ...event_time, required: true },
    user_data: user_data_field,
    content_ids: content_ids,
    content_name: content_name,
    content_type: content_type,
    contents: {
      ...contents,
      default: {
        // Segment Product Added is a single product event
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
    value: { ...value, default: { '@path': '$.properties.price' } },
    custom_data: custom_data,
    data_processing_options: data_processing_options,
    data_processing_options_country: data_processing_options_country,
    data_processing_options_state: data_processing_options_state
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

    const [data_options, country_code, state_code] = dataProcessingOptions(
      payload.data_processing_options,
      payload.data_processing_options_country,
      payload.data_processing_options_state
    )

    return request(
      `https://graph.facebook.com/v${get_api_version(features, statsContext)}/${settings.pixelId}/events`,
      {
        method: 'POST',
        json: {
          data: [
            {
              event_name: 'AddToCart',
              event_time: payload.event_time,
              event_source_url: payload.event_source_url,
              event_id: payload.event_id,
              action_source: payload.action_source,
              user_data: hash_user_data({ user_data: payload.user_data }),
              custom_data: {
                ...payload.custom_data,
                currency: payload.currency,
                value: payload.value,
                content_ids: payload.content_ids,
                content_name: payload.content_name,
                contents: payload.contents,
                content_type: payload.content_type
              },
              data_processing_options: data_options,
              data_processing_options_country: country_code,
              data_processing_options_state: state_code
            }
          ],
          ...(settings.testEventCode && { test_event_code: settings.testEventCode })
        }
      }
    )
  }
}

export default action
