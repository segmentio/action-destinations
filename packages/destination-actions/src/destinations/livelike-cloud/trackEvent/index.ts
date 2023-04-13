import { ActionDefinition, IntegrationError, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { apiBaseUrl } from '../properties'
import type { Payload } from './generated-types'

const processData = async (request: RequestClient, settings: Settings, payloads: Payload[]) => {
  const events = payloads.map((payload) => {
    if (!payload.livelike_profile_id && !payload.custom_id && !payload.segment_user_id) {
      throw new IntegrationError(
        '`livelike_profile_id` or `custom_id` or `user_id` is required.',
        'Missing required fields',
        400
      )
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
    event_name: {
      label: 'Event Name',
      type: 'string',
      required: true,
      description:
        'The name of the event being performed. For example, `User Registration` could be an event_name referring the event that is being sent to LiveLike.',
      default: {
        '@path': '$.event'
      }
    },
    event_type: {
      label: 'Event Type',
      type: 'string',
      required: true,
      description: 'The type of event (track/screen/page)',
      default: {
        '@path': '$.type'
      }
    },
    segment_user_id: {
      label: 'User ID',
      type: 'string',
      description: 'A unique identifier for a user.',
      default: {
        '@path': '$.userId'
      }
    },
    livelike_profile_id: {
      label: 'LiveLike User Profile ID',
      description: 'The unique LiveLike user identifier.',
      type: 'string',
      default: {
        '@path': '$.properties.livelike_profile_id'
      }
    },
    anonymous_id: {
      label: 'Segment Anonymous ID',
      description: 'Segment Anonymous ID.',
      required: false,
      type: 'hidden',
      default: {
        '@path': '$.anonymousId'
      }
    },
    custom_id: {
      label: 'Custom ID',
      description:
        'In case you are not able to store `livelike_profile_id`, LiveLike provides a way to create your own access tokens which helps us to map your user_id to a unique `livelike_profile_id`. Please refer [LiveLike Docs](https://docs.livelike.com/docs/client-generated-access-tokens) for more info.',
      required: false,
      type: 'string',
      default: {
        '@path': '$.properties.custom_id'
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
