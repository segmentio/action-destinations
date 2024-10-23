import { InputField } from '@segment/actions-core/destination-kit/types'

export const enable_batching: InputField = {
  label: 'Use Responsys Async API',
  description: 'Once enabled, Segment will collect events into batches of 200 before sending to Responsys.',
  type: 'boolean',
  default: true,
  unsafe_hidden: true
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  required: false,
  unsafe_hidden: true,
  default: 200
}
