import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { convertTimestamp, verifyParams } from '../ga4-functions'
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
  title: 'Login',
  description: 'Send event when a user logs in',
  defaultSubscription: 'type = "track" and event = "Signed In"',
  fields: {
    client_id: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
    method: {
      label: 'Method',
      type: 'string',
      description: 'The method used to login.'
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
            name: 'login',
            params: {
              method: payload.method,
              engagement_time_msec: payload.engagement_time_msec,
              ...verifyParams(payload.params)
            }
          }
        ],
        ...formatUserProperties(payload.user_properties)
      }
    })
  }
}

export default action
