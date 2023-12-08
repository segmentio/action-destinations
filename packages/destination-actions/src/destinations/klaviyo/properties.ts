import { InputField } from '@segment/actions-core/destination-kit/types'

export const list_id: InputField = {
  label: 'List Id',
  description: `'Insert the ID of the default list that you'd like to subscribe users to when you call .identify().'`,
  type: 'string',
  default: {
    '@path': '$.context.personas.external_audience_id'
  },
  unsafe_hidden: true,
  required: true
}

export const email: InputField = {
  label: 'Email',
  description: `The user's email to send to Klavio.`,
  type: 'string',
  default: {
    '@path': '$.context.traits.email'
  },
  readOnly: true
}

export const external_id: InputField = {
  label: 'External ID',
  description: `A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system. One of External ID and Email required.`,
  type: 'string'
}

export const enable_batching: InputField = {
  type: 'boolean',
  label: 'Batch Data to Klaviyo',
  description: 'When enabled, the action will use the klaviyo batch API.',
  default: true
}
