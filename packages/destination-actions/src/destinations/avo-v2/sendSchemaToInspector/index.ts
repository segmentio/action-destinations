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
        "Optional. Leave empty to report events at the gateway checkpoint: every event this mapping receives, as Segment receives it. To report the checkpoint of one of your other destinations (an output), add one Avo mapping per output, copy that output's trigger onto it, and paste the output's reference here. Copy the reference from the Inspector Setup tab of your gateway source in Avo. Avo cannot see inside your other destinations: this mapping MIRRORS the output's configuration rather than observing what the output actually sends, so keep its trigger in sync with the output. Only takes effect when the API key belongs to a gateway in Avo.",
      required: false
    },
    originHint: {
      label: 'Origin Hint',
      type: 'string',
      description:
        'Optional. Identifies the source that produced each event, so Avo can tell apart events from different apps flowing through this gateway. Map a path such as `$.context.library.name`, or enter a static label. Only takes effect when the API key belongs to a gateway in Avo. When set, the app version comes from Origin App Version only; the App Version field and the App Version Property setting are ignored.',
      required: false
    },
    originAppVersion: {
      label: 'Origin App Version',
      type: 'string',
      description:
        'Optional. App version of the source that produced each event, for example `$.context.app.version`. Overrides the App Version field and the App Version Property setting. If Origin Hint is set and this is empty, the event is sent without an app version.',
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
