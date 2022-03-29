import { InputField } from '@segment/actions-core/src/destination-kit/types'

export const customerProfileId: InputField = {
  label: 'Customer Profile ID',
  description: 'The customer profile integration identifier to use in Talon.One.',
  type: 'string',
  required: true
}

export const attribute: InputField = {
  label: 'Attribute-Value pairs',
  description:
    'Extra attributes associated with the customer profile. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).',
  type: 'object',
  required: false
}

export const audienceId: InputField = {
  label: 'Not used',
  description: 'You should get this audience ID from Talon.One.',
  type: 'integer',
  multiple: true,
  required: false
}

export const addAudienceId: InputField = {
  ...audienceId,
  label: 'List of audience ID to associate with the customer profile.'
}

export const deleteAudienceId: InputField = {
  ...audienceId,
  label: 'List of audience ID to dissociate with the customer profile.'
}
