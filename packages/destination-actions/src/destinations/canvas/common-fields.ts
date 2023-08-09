import { ActionDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'

export const commonFields: ActionDefinition<Settings>['fields'] = {
  enable_batching: {
    required: true,
    type: 'boolean',
    label: 'Send data in batch to Canvas',
    description: 'Sends events in bulk to Canvas. Highly recommended.',
    default: true
  },
  context: {
    label: 'Event context',
    description: 'Event context as it appears in Segment',
    type: 'object',
    required: false,
    default: { '@path': '$.context' }
  },
  anonymous_id: {
    label: 'Anonymous ID',
    description: 'The anonymous ID associated with the user',
    type: 'string',
    required: false,
    default: { '@path': '$.anonymousId' }
  },
  message_id: {
    label: 'Message ID',
    description: 'The Segment messageId',
    type: 'string',
    required: false,
    default: { '@path': '$.messageId' }
  },
  timestamp: {
    label: 'Timestamp',
    description: 'A timestamp of when the event took place. Default is current date and time.',
    type: 'string',
    default: {
      '@path': '$.timestamp'
    }
  },
  received_at: {
    label: 'Time',
    description: 'When the event was received.',
    type: 'datetime',
    required: true,
    default: {
      '@path': '$.receivedAt'
    }
  },
  sent_at: {
    label: 'Time',
    description: 'When the event was sent.',
    type: 'datetime',
    required: true,
    default: {
      '@path': '$.receivedAt'
    }
  },
  user_id: {
    type: 'string',
    required: false,
    description: "The user's id",
    label: 'User ID',
    default: {
      '@path': '$.userId'
    }
  }
}
