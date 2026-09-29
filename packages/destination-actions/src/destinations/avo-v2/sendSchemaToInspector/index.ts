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
    outputReference: {
      label: 'Output Reference',
      type: 'string',
      description:
        'Optional, for gateways only. Identifies an Avo gateway output. Leave this field empty unless Avo asks you to set it.',
      required: false
    },
    originHint: {
      label: 'Origin Hint',
      type: 'string',
      description:
        'Optional, for gateways only. Identifies the source that produced each event, so Avo can tell apart events from different apps flowing through a gateway. Map a path such as `$.context.library.name`, or enter a static label. Avo only reads this value when the API key belongs to a gateway, but setting it changes the app version sent with every API key: the App Version field and the App Version Property setting are then ignored, and the version comes from Origin App Version only, or is left empty if Origin App Version is empty. On a regular source, leave this field empty.',
      required: false
    },
    originAppVersion: {
      label: 'Origin App Version',
      type: 'string',
      description:
        'Optional, for gateways only. App version of the source that produced each event, for example `$.context.app.version`. When set, it replaces the App Version field and the App Version Property setting for every API key. If Origin Hint is set and this is empty, the event is sent without an app version. On a regular source, leave this field empty and use the App Version field instead.',
      required: false
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
