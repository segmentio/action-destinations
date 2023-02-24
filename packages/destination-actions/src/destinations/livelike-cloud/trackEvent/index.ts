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
      description:
        'The unique key of Action. LiveLike will uniquely identify any event by this key. For example, `user-registration` could be a key for the action `USER REGISTRATION`.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.action_key'
      }
    },
    action_name: {
      label: 'Action Name',
      description:
        'The name of the action being performed. For example, `User Registration` could be an action_name referring the event that is being sent to LiveLike.',
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
        'A unique identifier for a user. At least one of `User ID` or `LiveLike User Profile ID` is mandatory. In case you are not able to store `livelike_profile_id`, LiveLike provides a way to create your own access tokens which helps us to map your user_id to a unique `livelike_profile_id`. Please refer [LiveLike Docs](https://docs.livelike.com/docs/client-generated-access-tokens) for more info.',
      default: {
        '@path': '$.userId'
      }
    },
    livelike_profile_id: {
      label: 'LiveLike User Profile ID',
      description:
        'The unique LiveLike user identifier. At least one of `LiveLike User Profile ID` or `User ID` is mandatory.',
      type: 'string',
      default: {
        '@path': '$.properties.livelike_profile_id'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description:
        'The date and time when the event occurred in ISO 8601 format. Defaults to current time if not provided. For example, `2019-09-30T15:59:44.933696Z`.',
      type: 'string',
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
  }
  // Commented batching until the segment team supports rejecting a single event in a batch
  // performBatch: async (request, { settings, payload }) => {
  //   if (!settings.clientId || !settings.producerToken) {
  //     throw new IntegrationError('Missing client ID or producer token.')
  //   }
  //   return processData(request, settings, payload)
  // }
}

export default action
