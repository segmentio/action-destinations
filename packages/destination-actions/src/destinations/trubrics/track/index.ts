import type { ActionDefinition } from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Track an event in Trubrics.',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      type: 'string',
      required: true,
      description: 'The event name',
      label: 'Event Name',
      default: { '@path': '$.event' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Properties to send with the event',
      label: 'Event properties',
      default: { '@path': '$.properties' }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'user properties to send with the event',
      label: 'User properties',
      default: { '@path': '$.context.traits' }
    },
    context: {
      type: 'object',
      required: false,
      description: 'Context properties to send with the event',
      label: 'Context properties',
      default: { '@path': '$.context' }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: true,
      description: 'The timestamp of the event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    },
    user_id: {
      type: 'string',
      required: false,
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    anonymous_id: {
      type: 'string',
      required: false,
      description: 'The Anonymous ID associated with the user',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    }
  },
  perform: (request, { settings, payload }) => {
    const trubrics_properties = ['assistant_id', 'thread_id', 'text']

    const modifiedProperties = Object.entries(payload.properties || {}).reduce((acc, [key, value]) => {
      if (trubrics_properties.includes(key)) {
        acc[`$${key}`] = value
      } else {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, unknown>)

    return request(`https://${settings.url}/publish_event?project_api_key=${settings.apiKey}`, {
      method: 'post',
      json: {
        event: payload.event,
        properties: { ...modifiedProperties, ...payload.context },
        traits: payload.traits,
        timestamp: payload.timestamp,
        user_id: payload.user_id || payload.anonymous_id // Trubrics currently requires user_id
      }
    })
  }
}

export default action
