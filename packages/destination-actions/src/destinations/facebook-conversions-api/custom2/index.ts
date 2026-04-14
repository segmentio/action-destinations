import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { dataProcessingOptions } from '../fb-capi-properties'
import { hash_user_data } from '../fb-capi-user-data'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { get_api_version } from '../utils'
import { generate_app_data } from '../fb-capi-app-data'
import { customFields } from '../shared/fields'
import { send, getCustomEventData } from '../shared/functions'
import { EventType , FEATURE_FLAG_CUSTOM } from '../shared/constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event V2',
  description: 'Send a custom event',
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to sync records',
    default: 'add',
    choices: [{ label: 'Insert Records', value: 'add' }]
  },
  fields: customFields,
  perform: (request, { payload, settings, features, statsContext, syncMode }) => {
    if (syncMode === 'add') {
    
      if (features && features[FEATURE_FLAG_CUSTOM]) {
        return send(request, payload, settings, getCustomEventData, EventType.Custom, features, statsContext)
      }

      if (!payload.user_data) {
        throw new IntegrationError('Must include at least one user data property', 'Misconfigured required field', 400)
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
                event_name: payload.event_name,
                event_time: payload.event_time,
                action_source: payload.action_source,
                event_id: payload.event_id,
                event_source_url: payload.event_source_url,
                user_data: hash_user_data({ user_data: payload.user_data }),
                custom_data: payload.custom_data,
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
    } else {
      throw new IntegrationError(`Sync mode ${syncMode} is not supported`, 'Misconfigured sync mode', 400)
    }
  }
}

export default action