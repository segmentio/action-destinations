import { InputField } from '@segment/actions-core/destination-kit/types'

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests to the Klaviyo.',
  type: 'boolean',
  default: true
}

export const list_id: InputField = {
  label: 'List Id',
  description: `'Insert the ID of the default list that you'd like to subscribe users to when you call .identify().'`,
  type: 'string',
  dynamic: true
}

export const profile_id: InputField = {
  label: 'Profile Id',
  description: 'Profile Id of User',
  type: 'string'
}
