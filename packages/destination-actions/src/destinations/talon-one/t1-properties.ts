import { InputField } from '@segment/actions-core/src/destination-kit/types'

export const customerProfileId: InputField = {
  label: 'customer profile ID',
  description: 'Unique identifier of the customer profile.',
  type: 'string',
  required: true
}

export const attribute: InputField = {
  label: 'AVP (attribute-value pair) list',
  description: 'List the AVPs you need to update in the customer profile.',
  type: 'object',
  default: false
}

export const audienceId: InputField = {
  label: 'audience ID for customer profile.',
  description: 'Add or Delete Audience ID.',
  type: 'integer',
  multiple: true,
  default: false
}
