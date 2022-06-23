import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { convertTimestamp } from '../ga4-functions'
import {
  formatUserProperties,
  user_properties,
  params,
  user_id,
  client_id,
  engagement_time_msec,
  timestamp_micros
} from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sign Up',
  description: 'Send event when a user signs up to measure the popularity of each sign-up method',
  defaultSubscription: 'type = "track" and event = "Signed Up"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    method: {
      label: 'Method',
      description: 'The method used for sign up.',
      type: 'string',
      default: {
        '@path': `$.properties.type`
      }
    },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
    params: params
  },
  perform: (request, { payload }) => {
    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        user_id: payload.user_id,
        timestamp_micros: convertTimestamp(payload.timestamp_micros),
        events: [
          {
            name: 'sign_up',
            params: {
              method: payload.method,
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
