import { ActionDefinition, IntegrationError, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { apiBaseUrl } from '../properties'
import type { Payload } from './generated-types'

const processData = async (request: RequestClient, settings: Settings, payloads: Payload[]) => {
  const events = payloads.map((payload) => {
    if (!payload.livelike_profile_id && !payload.user_id) {
      throw new IntegrationError('`livelike_profile_id` or `user_id` is required.', 'Missing required fields', 400)
    }
    return payload
  })

  return request(`${apiBaseUrl}/applications/${settings.clientId}/segment-events/`, {
    method: 'post',
    json: {
      events
    }
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to LiveLike.',
  defaultSubscription: 'type = "track"',
  fields: {
    action_key: {
      label: 'Action Key',
      description: 'The unique key of Action. LiveLike will uniquely identify any event by this key.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.action_key'
      }
    },
    action_name: {
      label: 'Action Name',
      description: 'The name of the action being performed.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.action_name' },
          then: { '@path': '$.properties.action_name' },
          else: { '@path': '$.event' }
        }
      }
    },
    action_description: {
      label: 'Action Description',
      description: 'The description of the Action.',
      type: 'string',
      default: {
        '@path': '$.properties.action_description'
      }
    },
    user_id: {
      label: 'User ID',
      type: 'string',
      description:
        'A unique identifier for a user. At least one of `User ID` or `LiveLike User Profile ID` is mandatory.',
      default: {
        '@path': '$.userId'
      }
    },
    livelike_profile_id: {
      label: 'LiveLike User Profile ID',
      description:
        'The unique LiveLike user identifier. Atleast one of `LiveLike User Profile ID` or `User ID` is mandatory.',
      type: 'string',
      default: {
        '@path': '$.properties.livelike_profile_id'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'Properties of the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    if (!settings.clientId || !settings.producerToken) {
      throw new IntegrationError('Missing client ID or producer token.')
    }
    return processData(request, settings, [payload])
  },

  performBatch: async (request, { settings, payload }) => {
    if (!settings.clientId || !settings.producerToken) {
      throw new IntegrationError('Missing client ID or producer token.')
    }
    return processData(request, settings, payload)
  }
}

export default action
