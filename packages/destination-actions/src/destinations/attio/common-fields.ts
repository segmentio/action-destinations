import { ActionDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'

export const commonFields: ActionDefinition<Settings>['fields'] = {
  enable_batching: {
    label: 'Send data to Attio in batches',
    description: 'Send data to Attio in batches for much better performance.',
    type: 'boolean',
    required: false,
    unsafe_hidden: true,
    default: true
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
