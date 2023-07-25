import { InputField } from '@segment/actions-core/destination-kit/types'

export const name: InputField = {
  label: 'Segment Name',
  description:
    'The name of The Trade Desk CRM Data Segment you want to sync. If the audience name does not exist Segment will create one.',
  type: 'string',
  required: true
}

export const region: InputField = {
  label: 'Region',
  description: 'The geographical region of the CRM data segment based on the origin of PII.',
  type: 'string',
  required: true,
  default: 'US'
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
  type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.traits.email' in Personas events.
  default: {
    '@path': '$.context.traits.email'
  }
}

export const event_name: InputField = {
  label: 'Event Name',
  description: 'The name of the current Segment event.',
  type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
  default: {
    '@path': '$.event'
  }
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests to The Trade Desk CRM Segment.',
  type: 'boolean',
  default: true
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  required: false,
  default: 100000
}
