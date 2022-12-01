import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES } from '../constants'
import {
  currency,
  value,
  contents,
  validateContents,
  num_items,
  content_ids,
  event_time,
  action_source,
  custom_data,
  content_category,
  event_source_url,
  event_id,
  data_processing_options,
  data_processing_options_country,
  data_processing_options_state,
  dataProcessingOptions
} from '../fb-capi-properties'
import { user_data_field, hash_user_data } from '../fb-capi-user-data'
import { get_api_version } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Initiate Checkout',
  description: 'Send event when a user enters the checkout flow',
  defaultSubscription: 'type = "track" and event = "Checkout Started"',
  fields: {
    action_source: { ...action_source, required: true },
    event_time: { ...event_time, required: true },
    user_data: user_data_field,
    content_category: content_category,
    content_ids: content_ids,
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
    currency: currency,
    event_id: event_id,
    event_source_url: event_source_url,
    num_items: num_items,
    value: {
      ...value,
      default: { '@path': '$.properties.revenue' }
    },
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
              event_name: 'InitiateCheckout',
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
                contents: payload.contents,
                num_items: payload.num_items,
                content_category: payload.content_category
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
