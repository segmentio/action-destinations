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

const sendSchemaAction: ActionDefinition<Settings, Payload> = {
  title: 'Send Schema',
  description: 'Sends event schema to the Avo Inspector API',
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
    },
    appVersion: {
      label: 'App Version',
      type: 'string',
      description: 'Version of the app that sent the event',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.app' },
          then: { '@path': '$.context.app.version' },
          else: { '@path': '$.properties.appVersion' }
        }
      }
    },
    appName: {
      label: 'App Name',
      type: 'string',
      description: 'Name of the app that sent the event',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.app' },
          then: { '@path': '$.context.app.name' },
          else: { '@path': '$.properties.appName' }
        }
      }
    },
    pageUrl: {
      label: 'Page URL',
      type: 'string',
      description: 'URL of the page that sent the event',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.page' },
          then: { '@path': '$.context.page.url' },
          else: { '@path': '$.properties.url' }
        }
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    return processEvents(request, settings, [payload])
  },
  performBatch: async (request, { payload, settings }) => {
    return processEvents(request, settings, payload)
  }
}
export default sendSchemaAction
