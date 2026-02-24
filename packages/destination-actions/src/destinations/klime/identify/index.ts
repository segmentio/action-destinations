import type { ActionDefinition } from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'
import { sendRequest } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Identify a user in Klime and associate traits with them.',
  defaultSubscription: 'type = "identify"',
  fields: {
    messageId: {
      label: 'Message ID',
      type: 'string',
      required: true,
      description: 'Unique identifier for the event',
      default: { '@path': '$.messageId' }
    },
    userId: {
      label: 'User ID',
      type: 'string',
      required: true,
      description: 'Unique identifier for the user',
      default: { '@path': '$.userId' }
    },
    groupId: {
      label: 'Group ID',
      type: 'string',
      required: false,
      description: 'Unique identifier for the group/organization',
      default: { '@path': '$.context.groupId' }
    },
    traits: {
      label: 'User Traits',
      type: 'object',
      required: false,
      description: 'User attributes (email, name, plan, etc.)',
      default: { '@path': '$.traits' }
    },
    timestamp: {
      label: 'Timestamp',
      type: 'datetime',
      required: false,
      description: 'When the event occurred (ISO 8601)',
      default: { '@path': '$.timestamp' }
    },
    context: {
      label: 'Context',
      type: 'object',
      required: false,
      description: 'Contextual information about the event',
      default: { '@path': '$.context' }
    },
    enable_batching: {
      label: 'Enable Batching',
      type: 'boolean',
      required: true,
      default: true,
      unsafe_hidden: true,
      description: 'When enabled, events are sent in batches.'
    },
    batch_size: {
      label: 'Batch Size',
      type: 'number',
      required: false,
      default: 100,
      unsafe_hidden: true,
      description: 'Maximum number of events per batch request.'
    }
  },
  perform: async (request, { settings, payload }) => {
    return sendRequest(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return sendRequest(request, settings, payload)
  }
}

export default action
