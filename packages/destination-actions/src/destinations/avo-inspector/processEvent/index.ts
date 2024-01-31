import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { extractSchemaFromEvent } from './avo'

const processEvents = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  const events = payload.map((value) => extractSchemaFromEvent(value))

  const endpoint = 'https://api.avo.app/inspector/segment/v1/track'

  return request(endpoint, {
    method: 'post',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': settings.apiKey,
      env: settings.env
    },
    body: JSON.stringify(events)
  })
}

const processEventAction: ActionDefinition<Settings, Payload> = {
  title: 'Process Event',
  description: 'Receives an event and processes it using a custom transform function',
  defaultSubscription: 'type = "track"',
  fields: {
    // Define any fields your action expects here
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'Name of the event being sent',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Properties',
      type: 'object',
      description: 'Properties of the event being sent',
      required: true,
      default: {
        '@path': '$.properties'
      }
    },
    context: {
      label: 'Context',
      type: 'object',
      description: 'Context of the event being sent',
      required: true,
      default: {
        '@path': '$.context'
      }
    },
    messageId: {
      label: 'Message ID',
      type: 'string',
      description: 'Message ID of the event being sent',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    receivedAt: {
      label: 'Received At',
      type: 'string',
      description: 'Timestamp of when the event was received',
      required: true,
      default: {
        '@path': '$.receivedAt'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    return processEvents(request, settings, [payload])
  },
  performBatch: (request, { payload, settings }) => {
    return processEvents(request, settings, payload)
  }
}
export default processEventAction
