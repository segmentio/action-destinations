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
    thread_id: {
      type: 'string',
      required: false,
      description: 'The thread ID, used to associate events within a thread',
      label: 'Thread ID',
      default: { '@path': '$.properties.thread_id' }
    },
    text: {
      type: 'string',
      required: false,
      description: 'The event text (if not an LLM prompt or generation)',
      label: 'Text',
      default: { '@path': '$.properties.text' }
    },
    prompt: {
      type: 'string',
      required: false,
      description: 'A user prompt to an LLM',
      label: 'LLM User Prompt',
      default: { '@path': '$.properties.prompt' }
    },
    generation: {
      type: 'string',
      required: false,
      description: 'An LLM assistant response',
      label: 'LLM  Assistant Generation',
      default: { '@path': '$.properties.generation' }
    },
    assistant_id: {
      type: 'string',
      required: false,
      description: 'The LLM assistant ID (often the model name)',
      label: 'LLM Assistant ID',
      default: { '@path': '$.properties.assistant_id' }
    },
    latency: {
      type: 'number',
      required: false,
      description: 'The latency in seconds between the LLM prompt and generation',
      label: 'LLM Latency',
      default: { '@path': '$.properties.latency' }
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
    anonymous_id: {
      type: 'string',
      required: false,
      description: 'The Anonymous ID associated with the user',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    }
  },
  perform: (request, { settings, payload }) => {
    return request(`https://${settings.url}/publish_segment_event`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey
      },
      json: {
        payload: payload
      }
    })
  }
}

export default action
