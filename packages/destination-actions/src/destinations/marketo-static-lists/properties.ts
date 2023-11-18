import { InputField } from '@segment/actions-core/destination-kit/types'

export const external_id: InputField = {
  label: 'External ID',
  description: 'The ID of the Static List that users will be synced to.',
  type: 'string',
  default: {
    '@path': '$.context.personas.external_audience_id'
  },
  unsafe_hidden: true,
  required: true
}

export const email: InputField = {
  label: 'Email',
  description: `The user's email address to send to Marketo.`,
  type: 'string',
  default: {
    '@path': '$.context.traits.email'
  },
  readOnly: true,
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
  default: 300000,
  // unsafe_hidden: true, Leaving this visible for now to make it easier to test.
  required: true
}

export const event_name: InputField = {
  label: 'Event Name',
  description: 'The name of the current Segment event.',
  type: 'string',
  default: {
    '@path': '$.event'
  },
  readOnly: true,
  required: true
}
