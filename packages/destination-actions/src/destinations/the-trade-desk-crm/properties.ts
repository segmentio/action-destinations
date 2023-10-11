import { InputField } from '@segment/actions-core/destination-kit/types'

export const external_id: InputField = {
  label: 'External Audience ID',
  description: 'The CRM Data ID for The Trade Desk Segment.',
  type: 'string',
  default: {
    '@path': '$.context.personas.external_audience_id'
  },
  unsafe_hidden: true
}

export const pii_type: InputField = {
  label: 'PII Type',
  description: 'The type of personally identifiable data (PII) sent by the advertiser.',
  type: 'string',
  choices: [
    { label: 'Email', value: 'Email' },
    { label: 'Hashed Email', value: 'EmailHashedUnifiedId2' }
  ],
  required: true
}

export const email: InputField = {
  label: 'User Email',
  description: "The user's email address to send to The Trade Desk.",
  type: 'string',
  default: {
    '@path': '$.context.traits.email'
  }
}

export const event_name: InputField = {
  label: 'Event Name',
  description: 'The name of the current Segment event.',
  type: 'string',
  default: {
    '@path': '$.event'
  },
  unsafe_hidden: true
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests to The Trade Desk CRM Segment.',
  type: 'boolean',
  default: true,
  unsafe_hidden: true
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  required: false,
  default: 100000,
  unsafe_hidden: true
}
