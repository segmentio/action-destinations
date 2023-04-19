import { InputField } from '@segment/actions-core/src/destination-kit/types'

export const segment_name: InputField = {
  label: 'Segment Name',
  description: 'The name of The Trade Desk Segment you want to sync.',
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

export const merge_mode: InputField = {
  label: 'Merge Mode',
  description:
    'The way the newly uploaded personally identifiable information (PII) is to be merged with the existing data.',
  type: 'string',
  choices: [
    { label: 'Add (Data is merged by adding new PII on top of the existing PII)', value: 'Add' },
    { label: 'Replace (New PII data replaces the existing PII)', value: 'Replace' }
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
