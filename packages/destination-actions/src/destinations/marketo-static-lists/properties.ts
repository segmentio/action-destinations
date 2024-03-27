import { InputField } from '@segment/actions-core/destination-kit/types'

export const external_id: InputField = {
  label: 'External ID',
  description: 'The ID of the Static List that users will be synced to.',
  type: 'string',
  default: {
    '@path': '$.context.personas.external_audience_id'
  },
  unsafe_hidden: true
}

export const field_value: InputField = {
  label: 'Field Value',
  description: 'The value cooresponding to the lookup field.',
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.context.traits.email' },
      then: { '@path': '$.context.traits.email' },
      else: { '@path': '$.properties.email' }
    }
  },
  required: true
}

export const lookup_field: InputField = {
  label: 'Lookup Field',
  description: `The lead field to use for deduplication and filtering. This field must be apart of the Lead Info Fields below.`,
  type: 'string',
  choices: [
    { label: 'Email', value: 'email' },
    { label: 'Id', value: 'id' },
    { label: 'Cookies', value: 'cookies' },
    { label: 'Twitter ID', value: 'twitterId' },
    { label: 'Facebook ID', value: 'facebookId' },
    { label: 'LinkedIn ID', value: 'linkedinId' },
    { label: 'Salesforce Account ID', value: 'sfdcAccountId' },
    { label: 'Salesforce Contact ID', value: 'sfdcContactId' },
    { label: 'Salesforce Lead ID', value: 'sfdcLeadId' },
    { label: 'Salesforce Opportunity ID', value: 'sfdcOpptyId' }
  ],
  default: 'email',
  required: true
}

export const data: InputField = {
  label: 'Lead Info Fields',
  description:
    'The fields that contain data about the lead, such as Email, Last Name, etc. On the left-hand side, input the field name exactly how it appears in Marketo. On the right-hand side, map the Segment field that contains the corresponding value.',
  type: 'object',
  required: true,
  properties: {
    email: {
      label: 'Email',
      description: `The user's email address to send to Marketo.`,
      type: 'string'
    }
  },
  default: {
    email: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    }
  },
  additionalProperties: true
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
  unsafe_hidden: true,
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
