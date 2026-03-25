import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES } from '../constants'
import { get_api_version } from '../utils'
import { validateContents, dataProcessingOptions } from '../fb-capi-properties'
import { hash_user_data } from '../fb-capi-user-data'
import { generate_app_data } from '../fb-capi-app-data'
import { searchFields } from '../shared/fields'
import { send, getSearchEventData } from '../shared/functions'
import { EventType , FEATURE_FLAG_SEARCH } from '../shared/constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  description: 'Send event when a user searches content or products',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  fields: searchFields,
  perform: (request, { payload, settings, features, statsContext }) => {
    
    if (features && features[FEATURE_FLAG_SEARCH]) {
      return send(request, payload, settings, getSearchEventData, EventType.Search, features, statsContext)
    }
    
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

    const testEventCode = payload.test_event_code || settings.testEventCode

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
              app_data: generate_app_data(payload.app_data_field),
              data_processing_options: data_options,
              data_processing_options_country: country_code,
              data_processing_options_state: state_code
            }
          ],
          ...(testEventCode && { test_event_code: testEventCode })
        }
      }
    )
  }
}

export default action
