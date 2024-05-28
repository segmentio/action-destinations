import { ActionDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'

export const commonFields: ActionDefinition<Settings>['fields'] = {
  enable_batching: {
    label: 'Batch events',
    description:
      'Events will be sent Attio in batches. When batching is enabled any invalid events will be silently dropped.',
    type: 'boolean',
    required: false,
    default: false
  },

  batch_size: {
    label: 'Batch Size',
    description: 'Max batch size to send to Attio (limit is 10,000)',
    type: 'number',
    required: false,
    unsafe_hidden: true,
    default: 1_000
  },

  received_at: {
    label: 'Received at',
    description: 'When the event was received.',
    type: 'datetime',
    required: false,
    default: {
      '@path': '$.receivedAt'
    }
  }
}
