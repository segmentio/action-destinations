import { InputField } from '@segment/actions-core/destination-kit/types'
// import { IntegrationError } from '@segment/actions-core'

export const userData: InputField = {
  label: 'Recepient Data',
  description: 'Record data that represents Field Names and corresponding values for the recipient.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only',
  required: true
}

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
