import { GlobalSetting, InputField } from '@segment/actions-core'

export const advertiserId: GlobalSetting = {
  type: 'string',
  label: 'Advertiser ID',
  description: 'Your Vibe advertiser ID.',
  required: true
}

export const authToken: GlobalSetting = {
  type: 'string',
  label: 'Auth Token',
  description: 'Your Vibe authentication token.',
  required: true
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests.',
  type: 'boolean',
  default: true,
  unsafe_hidden: true,
  required: true
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  default: 10000,
  unsafe_hidden: true,
  required: true
}
