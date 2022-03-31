import { InputField } from '@segment/actions-core/src/destination-kit/types'

export const customerProfileId: InputField = {
  label: 'Customer Profile ID',
  description: 'Unique identifier of the customer profile.',
  type: 'string',
  required: true
}

export const attribute: InputField = {
  label: 'Attribute-Value pairs',
  description: 'Arbitrary additional JSON data associated with the customer profile.',
  type: 'object',
  required: false
}

export const audienceId: InputField = {
  label: 'Talon.One audience ID',
  description: 'You should get this audience ID from Talon.One.',
  type: 'integer',
  multiple: true,
  required: false
}
