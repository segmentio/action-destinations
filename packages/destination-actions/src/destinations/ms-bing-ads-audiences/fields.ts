import { InputField } from '@segment/actions-core/destination-kit/types'

export const audience_id: InputField = {
  label: 'Audience ID',
  description: 'The ID of the audience to which you want to add or remove users.',
  type: 'string',
  required: true,
  default: {
    '@path': '$.context.personas.external_audience_id'
  },
  unsafe_hidden: true
}

export const identifier_type: InputField = {
  label: 'Identifier Type',
  description: 'The type of identifier you are using to sync users.',
  type: 'string',
  required: true,
  default: 'Email',
  choices: [
    { label: 'Email', value: 'Email' },
    { label: 'CRM ID', value: 'CRM' }
  ]
}

export const email: InputField = {
  label: 'Email',
  description: 'The email address of the user to add or remove from the audience.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.traits.email'
  },
  category: 'hashedPII',
  format: 'email'
}

export const crm_id: InputField = {
  label: 'CRM ID',
  description: 'The CRM ID of the user to add or remove from the audience.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.userId'
  }
}

export const operation: InputField = {
  label: 'Operation',
  description: 'The operation to perform on the audience.',
  type: 'string',
  required: true,
  default: 'Add',
  choices: [
    { label: 'Add', value: 'Add' },
    { label: 'Remove', value: 'Remove' }
  ]
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description:
    'Enable batching of user syncs to optimize performance. When enabled, user syncs will be sent in batches based on the specified batch size.',
  type: 'boolean',
  required: true,
  default: true
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description:
    'The number of user syncs to include in each batch when batching is enabled. Must be between 1 and 1000.',
  type: 'number',
  required: true,
  default: 1000,
  unsafe_hidden: true
}

export const batch_keys: InputField = {
  label: 'Batch Keys',
  description:
    'The keys to use for batching user syncs. Users with the same values for these keys will be grouped together in the same batch.',
  type: 'string',
  required: false,
  default: ['identifier_type', 'audience_id', 'operation'],
  unsafe_hidden: true,
  multiple: true
}
