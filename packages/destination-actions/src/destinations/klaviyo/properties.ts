import { InputField } from '@segment/actions-core/destination-kit/types'

export const list_id: InputField = {
  label: 'List Id',
  description: `'Insert the ID of the default list that you'd like to subscribe users to when you call .identify().'`,
  type: 'string',
  dynamic: true
}

export const email: InputField = {
  label: 'Email',
  description: 'Email of User',
  type: 'string'
}
