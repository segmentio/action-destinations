import { InputField } from '@segment/actions-core/destination-kit/types'

export const external_id: InputField = {
  label: 'External Id',
  description: `'Insert the ID of the default list that you'd like to subscribe users to when you call .identify().'`,
  type: 'string',
  default: {
    '@path': '$.context.personas.external_audience_id'
  },
  unsafe_hidden: true
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
