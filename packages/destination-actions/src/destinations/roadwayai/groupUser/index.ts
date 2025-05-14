import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group User',
  description: 'Forward group event to RoadwayAI.',
  defaultSubscription: 'type = "group"',
  fields: {
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to RoadwayAI',
      description: 'When enabled, the action will use the RoadwayAI batch API.',
      unsafe_hidden: true,
      default: true
    },
    user_id: {
      type: 'string',
      unsafe_hidden: true,
      description: 'The identifier of the user',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      type: 'string',
      unsafe_hidden: true,
      description: 'Anonymous ID of the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    group_id: {
      type: 'string',
      unsafe_hidden: true,
      description: 'ID of the group',
      label: 'Group ID',
      default: {
        '@path': '$.groupId'
      }
    },
    group_name: {
      type: 'string',
      description: 'Name of the group where user belongs to',
      label: 'Group name',
      default: {
        '@path': '$.traits.name'
      }
    },
    timestamp: {
      type: 'string',
      unsafe_hidden: true,
      required: true,
      description: 'The time the event occured in UTC',
      label: 'Event timestamp',
      default: {
        '@path': '$.timestamp'
      }
    },
    traits: {
      type: 'object',
      description: 'Group traits',
      label: 'Group traits',
      default: {
        '@path': '$.traits'
      }
    },
    context: {
      type: 'object',
      description: 'Event context',
      label: 'Event context',
      default: {
        '@path': '$.context'
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    return request(`https://app.roadwayai.com/api/v1/segment/events/group`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: [payload]
    })
  },

  performBatch: async (request, { settings, payload }) => {
    return request(`https://app.roadwayai.com/api/v1/segment/events/group`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: payload
    })
  }
}

export default action
