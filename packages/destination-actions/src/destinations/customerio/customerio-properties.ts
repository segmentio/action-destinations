import { InputField } from '@segment/actions-core'

export const eventProperties: Record<string, InputField> = {
  enable_batching: {
    type: 'boolean',
    label: 'Enable Batching',
    description: 'Set as true to ensure Segment sends data to Customer.io in batches.',
    default: true
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    required: false,
    minimum: 2,
    maximum: 100,
    default: 50
  }
}
