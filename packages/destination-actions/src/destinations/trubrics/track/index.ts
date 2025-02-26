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
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: false,
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
    llm_properties: {
      label: 'LLM Event Properties',
      description: 'The properties associated with an LLM event',
      type: 'object',
      additionalProperties: false,
      required: false,
      defaultObjectUI: 'keyvalue:only',
      properties: {
        assistant_id: {
          type: 'string',
          required: false,
          description: 'The LLM assistant ID (often the model name)',
          label: 'LLM Assistant ID'
        },
        prompt: {
          type: 'string',
          required: false,
          description: 'A user prompt to an LLM',
          label: 'LLM User Prompt'
        },
        generation: {
          type: 'string',
          required: false,
          description: 'An LLM assistant response',
          label: 'LLM  Assistant Generation'
        },
        latency: {
          type: 'number',
          required: false,
          description: 'The latency in seconds between the LLM prompt and generation',
          label: 'LLM Latency'
        }
      },
      default: {
        assistant_id: {
          '@path': '$.properties.$trubrics_assistant_id'
        },
        prompt: {
          '@path': '$.properties.$trubrics_prompt'
        },
        generation: {
          '@path': '$.properties.$trubrics_generation'
        },
        latency: {
          '@path': '$.properties.$trubrics_latency'
        }
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Properties to send with the event',
      label: 'Event properties',
      default: { '@path': '$.properties' }
    },
    context: {
      type: 'object',
      required: false,
      description: 'Context properties to send with the event',
      label: 'Context properties',
      default: { '@path': '$.context' }
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
    const trubricsProperties = ['thread_id', 'text', 'prompt', 'generation', 'assistant_id', 'latency']
    const segmentProperties: typeof payload.properties = {}
    if (payload.properties) {
      Object.keys(payload.properties).forEach((key) => {
        if (!trubricsProperties.includes(key)) {
          segmentProperties[key] = payload.properties?.[key]
        }
      })
    }

    return request(`https://${settings.url}/publish_segment_event`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey
      },
      json: {
        event: payload.event,
        timestamp: payload.timestamp,
        user_id: payload.user_id,
        anonymous_id: payload.anonymous_id,
        llm_properties: payload.llm_properties,
        context: payload.context,
        properties: payload.properties
      }
    })
  }
}

export default action
