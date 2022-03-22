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

export const dataItem: InputField = {
  label: 'Data item to change customer profile audiences',
  description:
    'An array of JSON objects that contains customer profile identifier and list of audiences to associate and dissociate with the indicated customer profile. Customer profile ID and at least one audience ID are required.',
  type: 'object',
  multiple: true,
  properties: {
    customerProfileId: { ...customerProfileId },
    addAudienceIds: { ...addAudienceId },
    deleteAudienceIds: { ...deleteAudienceId }
  }
}
