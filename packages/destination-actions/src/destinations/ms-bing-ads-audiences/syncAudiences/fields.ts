import { InputField } from '@segment/actions-core/destination-kit/types'
import { CRM_CONDITION, EMAIL_CONDITION } from '../constants'

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

export const computation_class: InputField = {
  label: 'Computation Class',
  description: 'Hidden field: The computation class for the audience.',
  type: 'string',
  required: true,
  default: {
    '@path': '$.context.personas.computation_class'
  },
  choices: [
    { label: 'audience', value: 'audience' },
    { label: 'journey_step', value: 'journey_step' }
  ],
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
  required: {
    ...EMAIL_CONDITION
  },
  depends_on: {
    ...EMAIL_CONDITION
  },
  default: {
    '@if': {
      exists: { '@path': '$.context.traits.email' },
      then: { '@path': '$.context.traits.email' },
      else: { '@path': '$.properties.email' }
    }
  },
  category: 'hashedPII'
}

export const crm_id: InputField = {
  label: 'CRM ID',
  description: 'The CRM ID of the user to add or remove from the audience.',
  type: 'string',
  required: {
    ...CRM_CONDITION
  },
  depends_on: {
    ...CRM_CONDITION
  },
  default: {
    '@path': '$.userId'
  }
}

export const traits_or_props: InputField = {
  label: '[Hidden] Traits or Properties',
  description:
    '[Hidden] properties object from track() payloads. Note: identify calls are not handled and are disabled in the Partner Portal.',
  type: 'object',
  required: true,
  unsafe_hidden: true,
  default: { '@path': '$.properties' }
}

export const audience_key: InputField = {
  label: '[Hidden] Audience Key',
  description: '[Hidden]: The Engage Audience Key / Slug.',
  type: 'string',
  required: true,
  unsafe_hidden: true,
  default: {
    '@path': '$.context.personas.computation_key'
  }
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description:
    'Enable batching of user syncs to optimize performance. When enabled, user syncs will be sent in batches based on the specified batch size.',
  type: 'boolean',
  required: true,
  default: true,
  readOnly: true
}

export const batch_size: InputField = {
  label: '[Hidden] Batch Size',
  description:
    '[Hidden] The number of user syncs to include in each batch when batching is enabled. Must be between 1 and 1000.',
  type: 'number',
  required: true,
  default: 1000,
  minimum: 1,
  maximum: 1000,
  unsafe_hidden: true
}

export const batch_keys: InputField = {
  label: '[Hidden] Batch Keys',
  description:
    '[Hidden] The keys to use for batching user syncs. Users with the same values for these keys will be grouped together in the same batch.',
  type: 'string',
  required: false,
  default: ['identifier_type', 'audience_id'],
  unsafe_hidden: true,
  multiple: true
}
