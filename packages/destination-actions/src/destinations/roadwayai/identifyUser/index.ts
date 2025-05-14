import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Set the user ID for a particular device ID or update user properties.',
  defaultSubscription: 'type = "identify"',
  fields: {
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to RoadwayAI',
      description: 'When enabled, the action will use the RoadwayAI batch API.',
      unsafe_hidden: true,
      default: true
    },
    timestamp: {
      label: 'Timestamp',
      description: 'A timestamp of when the event took place. Default is current date and time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    ip: {
      label: 'IP Address',
      type: 'string',
      description: "The IP address of the user. This is only used for geolocation and won't be stored.",
      default: {
        '@path': '$.context.ip'
      }
    },
    user_id: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description: 'The unique user identifier set by you',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      type: 'string',
      allowNull: true,
      description: 'The generated anonymous ID for the user',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      description: 'Properties to set on the user profile',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    return request(`https://app.roadwayai.com/api/v1/segment/events/identify`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: [payload]
    })
  },

  performBatch: async (request, { settings, payload }) => {
    return request(`https://app.roadwayai.com/api/v1/segment/events/identify`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: payload
    })
  }
}

export default action
