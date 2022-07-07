import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { verifyCurrency, verifyParams } from '../ga4-functions'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  formatUserProperties,
  user_properties,
  params,
  client_id,
  user_id,
  currency,
  value,
  engagement_time_msec
} from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Generate Lead',
  description: 'Send event when a user submits a form or request for information',
  defaultSubscription: 'type = "track"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    currency: { ...currency },
    value: { ...value },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
    params: params
  },
  perform: (request, { payload, features }) => {
    if (payload.currency) {
      verifyCurrency(payload.currency)
    }

    // Google requires that currency be included at the event level if value is included.
    if (payload.value && payload.currency === undefined) {
      throw new IntegrationError('Currency is required if value is set.', 'Misconfigured required field', 400)
    }

    if (features && features['actions-google-analytics-4-verify-params-feature']) {
      return request('https://www.google-analytics.com/mp/collect', {
        method: 'POST',
        json: {
          client_id: payload.client_id,
          user_id: payload.user_id,
          events: [
            {
              name: 'generate_lead',
              params: {
                currency: payload.currency,
                value: payload.value,
                engagement_time_msec: payload.engagement_time_msec,
                ...verifyParams(payload.params)
              }
            }
          ],
          ...formatUserProperties(payload.user_properties)
        }
      })
    }

    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        user_id: payload.user_id,
        events: [
          {
            name: 'generate_lead',
            params: {
              currency: payload.currency,
              value: payload.value,
              engagement_time_msec: payload.engagement_time_msec,
              ...payload.params
            }
          }
        ],
        ...formatUserProperties(payload.user_properties)
      }
    })
  }
}

export default action
