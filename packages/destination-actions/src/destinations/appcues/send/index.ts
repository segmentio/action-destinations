import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

interface AppcuesRequest {
  type: string
  userId?: string
  anonymousId?: string
  event?: string
  properties?: Record<string, any>
  traits?: Record<string, any>
  groupId?: string
}

async function sendToAppcues(request: RequestClient, endpoint: string, apiKey: string, data: AppcuesRequest) {
  return request(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    json: data
  })
}

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
    event_name: {
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
        '@path': '$.traits'
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
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },

  perform: async (request, { payload, settings }) => {
    const { endpoint, apiKey } = settings
    const { userId, anonymousId, event_name, properties, user_traits, groupId, group_traits } = payload

    const requests: Promise<any>[] = []

    // Send track event if event_name is present
    if (event_name) {
      const trackRequest: AppcuesRequest = {
        type: 'track',
        event: event_name
      }

      if (userId) trackRequest.userId = userId
      if (anonymousId) trackRequest.anonymousId = anonymousId
      if (properties) trackRequest.properties = properties

      requests.push(sendToAppcues(request, endpoint, apiKey, trackRequest))
    }

    // Send identify event if user_traits is present and has properties
    if (user_traits && Object.keys(user_traits).length > 0) {
      const identifyRequest: AppcuesRequest = {
        type: 'identify',
        traits: user_traits
      }

      if (userId) identifyRequest.userId = userId
      if (anonymousId) identifyRequest.anonymousId = anonymousId

      requests.push(sendToAppcues(request, endpoint, apiKey, identifyRequest))
    }

    // Send group event if groupId is present
    if (groupId) {
      const groupRequest: AppcuesRequest = {
        type: 'group',
        groupId: groupId
      }

      if (userId) groupRequest.userId = userId
      if (anonymousId) groupRequest.anonymousId = anonymousId
      if (group_traits && Object.keys(group_traits).length > 0) {
        groupRequest.traits = group_traits
      }

      requests.push(sendToAppcues(request, endpoint, apiKey, groupRequest))
    }

    // Execute all requests in parallel
    if (requests.length === 0) {
      throw new Error('No valid data to send. At least one of event_name, user_traits, or groupId must be provided.')
    }

    await Promise.all(requests)
  }
}

export default action
