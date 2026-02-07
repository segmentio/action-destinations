import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AppcuesRequest } from '../types'
import { sendToAppcues } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description:
    'Send events to Appcues. This action can send track, identify, and group events based on which fields are populated.',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group"',

  fields: {
    userId: {
      label: 'User ID',
      description: 'The unique user identifier',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'The anonymous user identifier',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    event: {
      label: 'Event Name',
      description: 'The name of the event to track',
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'Properties associated with the event',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    user_traits: {
      label: 'User Traits',
      description: 'Traits to identify the user with',
      type: 'object',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits' },
          then: { '@path': '$.context.traits' },
          else: { '@path': '$.traits' }
        }
      }
    },
    groupId: {
      label: 'Group ID',
      description: 'The unique group identifier',
      type: 'string',
      default: {
        '@path': '$.groupId'
      }
    },
    group_traits: {
      label: 'Group Traits',
      description: 'Traits associated with the group',
      type: 'object'
    },
    context: {
      label: 'Context',
      description: 'Context object containing additional event metadata',
      type: 'object',
      default: {
        '@path': '$.context'
      }
    },
    integrations: {
      label: 'Integrations',
      description: 'Integrations object to control which destinations receive this event',
      type: 'object',
      default: {
        '@path': '$.integrations'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    messageId: {
      label: 'Message ID',
      description: 'The unique message identifier',
      type: 'string',
      default: {
        '@path': '$.messageId'
      }
    }
  },

  perform: async (request, { payload, settings }) => {
    const { endpoint, apiKey } = settings
    const {
      userId,
      anonymousId,
      event,
      properties,
      user_traits,
      groupId,
      group_traits,
      context,
      integrations,
      timestamp,
      messageId
    } = payload

    const requests: Promise<any>[] = []

    // Send track event if event is present
    if (event) {
      const trackRequest: AppcuesRequest = {
        type: 'track',
        event,
        ...(userId ? { userId } : {}),
        ...(anonymousId ? { anonymousId } : {}),
        ...(properties ? { properties } : {}),
        ...(context ? { context } : {}),
        ...(integrations ? { integrations } : {}),
        ...(timestamp ? { timestamp } : {}),
        ...(messageId ? { messageId } : {})
      }

      requests.push(sendToAppcues(request, endpoint, apiKey, trackRequest))
    }

    // Send identify event if user_traits is present and has properties
    if (user_traits && Object.keys(user_traits).length > 0) {
      const identifyRequest: AppcuesRequest = {
        type: 'identify',
        traits: user_traits,
        ...(userId ? { userId } : {}),
        ...(anonymousId ? { anonymousId } : {}),
        ...(context ? { context } : {}),
        ...(integrations ? { integrations } : {}),
        ...(timestamp ? { timestamp } : {}),
        ...(messageId ? { messageId } : {})
      }

      requests.push(sendToAppcues(request, endpoint, apiKey, identifyRequest))
    }

    // Send group event if groupId is present
    if (groupId) {
      const groupRequest: AppcuesRequest = {
        type: 'group',
        groupId,
        ...(userId ? { userId } : {}),
        ...(anonymousId ? { anonymousId } : {}),
        ...(group_traits && Object.keys(group_traits).length > 0 ? { traits: group_traits } : {}),
        ...(context ? { context } : {}),
        ...(integrations ? { integrations } : {}),
        ...(timestamp ? { timestamp } : {}),
        ...(messageId ? { messageId } : {})
      }

      requests.push(sendToAppcues(request, endpoint, apiKey, groupRequest))
    }

    // Execute all requests in parallel
    if (requests.length === 0) {
      throw new Error('No valid data to send. At least one of event, user_traits, or groupId must be provided.')
    }

    await Promise.all(requests)
  }
}

export default action
