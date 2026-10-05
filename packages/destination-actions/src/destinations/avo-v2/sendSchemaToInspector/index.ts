import type { ActionDefinition, ExecuteInput } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions/functions'

// The runtime passes the unmapped event as rawData, which ExecuteInput does not declare; the same
// extension liveramp-audiences uses.
type ExecuteInputRaw<P, R> = ExecuteInput<Settings, P> & { rawData?: R }

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
        'Optional, for gateways only. Requires Gateway Support. Identifies an Avo gateway output. Leave this field empty unless Avo asks you to set it.',
      required: false
    },
    originHint: {
      label: 'Origin Hint',
      type: 'string',
      description:
        'Optional, for gateways only. Requires Gateway Support. Identifies the source that produced each event, so Avo can tell apart events from different apps flowing through a gateway. Usually a static label naming this Segment source, such as "ios-app". If one source carries events from several apps or platforms, map a path instead, such as `$.context.app.name` or `$.context.library.name`. The app version is the event\'s own: the App Version Property setting, then the App Version field (`$.context.app.version`, which only mobile sources send). For a web source, set the App Version Property setting to the event property that carries its version, such as `app_version`. With an origin hint and no version, the event is sent without an app version. On a regular source, leave this field empty.',
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
  perform: async (request, { payload, settings, rawData }: ExecuteInputRaw<Payload, unknown>) => {
    return send(request, settings, [payload], [rawData])
  },
  performBatch: async (request, { payload, settings, rawData }: ExecuteInputRaw<Payload[], unknown[]>) => {
    return send(request, settings, payload, rawData)
  }
}
export default action
