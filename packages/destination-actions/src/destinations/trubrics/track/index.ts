import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../../trubrics_/generated-types'
import type { Payload } from '../../trubrics_/track/generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Track an event in Trubrics.',
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
    trubrics_properties: {
      type: 'object',
      required: false,
      description: 'Trubrics reserved properties to send with the event',
      label: 'Trubrics Reserved Properties',
      properties: {
        assistant_id: {
          type: 'string',
          required: false,
          description: 'The ID associated with the AI assistant',
          label: 'AI Assistant ID'
        },
        thread_id: {
          type: 'string',
          required: false,
          description: 'The ID associated with the thread',
          label: 'Thread ID'
        },
        text: {
          type: 'string',
          required: false,
          description: 'The text associated with the event',
          label: 'Text'
        },
        anonymous_id: {
          type: 'string',
          required: false,
          description: 'The anonymous ID associated with the user',
          label: 'Anonymous ID'
        }
      },
      default: {
        assistant_id: { '@path': '$.properties.assistant_id' },
        thread_id: { '@path': '$.properties.thread_id' },
        text: { '@path': '$.properties.text' },
        anonymous_id: { '@path': '$.anonymousId' }
      }
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
    }
  },
  perform: (request, { settings, payload }) => {
    const { properties = {}, trubrics_properties = {}, ...restPayload } = payload
    const mergedProperties: Record<string, unknown> = { ...properties }
    Object.keys(trubrics_properties).forEach((key: string) => {
      mergedProperties[`$${key}`] = trubrics_properties[key as keyof typeof trubrics_properties]
      delete mergedProperties[key]
    })

    return request(`https://api.trubrics.com/publish_event?project_api_key=${settings.apiKey}`, {
      method: 'post',
      json: {
        ...restPayload,
        properties: mergedProperties
      }
    })
  }
}

export default action
