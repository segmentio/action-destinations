import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Data',
  description: 'Send data to SingleStore.',
  defaultSubscription:
    'type = "track" or type = "screen" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {
    messageid: {
      label: 'Message ID',
      description: 'A unique identifier for the message.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    type: {
      label: 'Type',
      description: 'The type of the event (e.g., "track", "identify", "page", "screen", "group", "alias").',
      type: 'string',
      required: true,
      choices: [
        { label: 'Track', value: 'track' },
        { label: 'Identify', value: 'identify' },
        { label: 'Page', value: 'page' },
        { label: 'Screen', value: 'screen' },
        { label: 'Group', value: 'group' },
        { label: 'Alias', value: 'alias' }
      ],
      default: {
        '@path': '$.type'
      }
    },
    event: {
      label: 'Event',
      description: 'The name of the event. Only required for "track" events.',
      type: 'string',
      required: {
        conditions: [{ fieldKey: 'type', operator: 'is', value: 'track' }]
      },
      default: {
        '@path': '$.event'
      }
    },
    name: {
      label: 'Name',
      description: 'The name of the page or screen.',
      type: 'string',
      default: {
        '@path': '$.name'
      }
    },
    properties: {
      label: 'Properties',
      description: 'The properties of the track, page or screen event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    userId: {
      label: 'User ID',
      description: 'The user ID associated with the event.',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'The anonymous ID associated with the event.',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    groupId: {
      label: 'Group ID',
      description: 'The group ID associated with the event.',
      type: 'string',
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      label: 'Traits',
      description: 'The traits of the user associated with the event.',
      type: 'object',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits' },
          then: { '@path': '$.context.traits' },
          else: { '@path': '$.traits' }
        }
      }
    },
    context: {
      label: 'Context',
      description: 'The context of the event. Contains user environment information.',
      type: 'object',
      default: {
        '@path': '$.context'
      }
    },
    max_batch_size: {
      label: 'Max Batch Size',
      description: 'The maximum number of rows to include in a batch.',
      type: 'number',
      required: true,
      default: 100
    },
    enable_batching: {
      type: 'boolean',
      label: 'Enable Batching',
      description: 'Batch events to SingleStore',
      default: true,
      unsafe_hidden: true
    }
  },
  perform: async (request, { payload, settings }) => {
    return await send(request, [payload], settings)
  },
  performBatch: async (request, { payload, settings }) => {
    return await send(request, payload, settings)
  }
}

export default action
