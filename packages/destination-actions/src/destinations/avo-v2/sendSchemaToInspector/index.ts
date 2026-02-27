import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions/functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Schema From Event',
  description: 'Sends event schema to the Avo Inspector API',
  defaultSubscription: 'type = "track"',
  fields: {
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
    createdAt: {
      label: 'Created At',
      type: 'string',
      description: 'Timestamp of when the event was sent',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    appVersion: {
      label: 'App Version',
      type: 'string',
      description: 'Version of the app that sent the event',
      required: false,
      default: {
        '@path': '$.context.app.version'
      }
    },
    appName: {
      label: 'App Name',
      type: 'string',
      description: 'Name of the app that sent the event',
      required: false,
      default: {
        '@path': '$.context.app.name'
      }
    },
    pageUrl: {
      label: 'Page URL',
      type: 'string',
      description: 'URL of the page that sent the event',
      required: false,
      default: {
        '@path': '$.context.page.url'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      type: 'string',
      description: 'Anonymous ID of the user. Used as stream identifier for batching and event spec fetching.',
      required: false,
      default: {
        '@path': '$.anonymousId'
      }
    },
    userId: {
      label: 'User ID',
      type: 'string',
      description:
        'User ID of the user. Used as fallback stream identifier (hashed) when anonymousId is not available.',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      required: false,
      default: 10,
      readOnly: false,
      unsafe_hidden: true
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching events together.',
      type: 'string',
      required: false,
      multiple: true,
      default: ['anonymousId', 'userId'],
      unsafe_hidden: true
    }
  },
  perform: async (request, { payload, settings }) => {
    return send(request, settings, [payload])
  },
  performBatch: async (request, { payload, settings }) => {
    return send(request, settings, payload)
  }
}
export default action
