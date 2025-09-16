import { InputField } from '@segment/actions-core'
import { DependsOnConditions } from '@segment/actions-core/destination-kit/types'

export const external_id: InputField = {
  label: 'External ID',
  description: 'The ID of the Audience.',
  type: 'string',
  default: {
    '@path': '$.context.personas.external_audience_id'
  },
  unsafe_hidden: true
}

export const advertiser_id: InputField = {
  label: 'Advertiser ID',
  description: 'The Advertiser ID associated with the DV360 Audience.',
  type: 'string',
  default: {
    '@path': '$.context.personas.audience_settings.advertiserId'
  },
  unsafe_hidden: true
}

const atLeastOneIdentifierRequired: DependsOnConditions = {
  match: 'any',
  conditions: [
    { operator: 'is_not', fieldKey: 'emailAddress', value: undefined },
    { operator: 'is_not', fieldKey: 'phoneNumber', value: undefined },
    // TODO: All of these must be present for the name+address path
    { operator: 'is_not', fieldKey: 'givenName', value: undefined },
    { operator: 'is_not', fieldKey: 'familyName', value: undefined },
    { operator: 'is_not', fieldKey: 'regionCode', value: undefined },
    { operator: 'is_not', fieldKey: 'postalCode', value: undefined }
  ]
}

export const emailAddress: InputField = {
  label: 'Email Address',
  description: 'The email address of the audience member.',
  type: 'string',
  required: atLeastOneIdentifierRequired,
  default: { '@path': '$.traits.email' },
  category: 'hashedPII'
}

export const phoneNumber: InputField = {
  label: 'Phone Number',
  description: 'The phone number of the audience member.',
  type: 'string',
  required: atLeastOneIdentifierRequired,
  default: { '@path': '$.traits.phone' },
  category: 'hashedPII'
}

export const postalCode: InputField = {
  label: 'Postal Code',
  description: 'The postal code of the audience member.',
  type: 'string',
  required: atLeastOneIdentifierRequired,
  default: { '@path': '$.traits.postalCode' }
}

export const givenName: InputField = {
  label: 'Given Name',
  description: 'The given name (first name) of the audience member.',
  type: 'string',
  required: atLeastOneIdentifierRequired,
  default: { '@path': '$.traits.firstName' },
  category: 'hashedPII'
}

export const familyName: InputField = {
  label: 'Family Name',
  description: 'The family name (last name) of the audience member.',
  type: 'string',
  required: atLeastOneIdentifierRequired,
  default: { '@path': '$.traits.lastName' },
  category: 'hashedPII'
}

export const countryCode: InputField = {
  label: 'Country Code',
  description: `The country code of the user.`,
  type: 'string',
  default: {
    '@path': '$.context.traits.countryCode'
  }
}

export const mobileDeviceIds: InputField = {
  label: 'Mobile Device IDs',
  description: `A list of mobile device IDs defining Customer Match audience members. The size of mobileDeviceIds mustn't be greater than 500,000.`,
  type: 'string',
  default: {
    '@path': '$.context.traits.mobileDeviceIds'
  }
}
export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests.',
  type: 'boolean',
  default: true,
  unsafe_hidden: true,
  required: true
}

//Max set based on Google documentation maximum: https://developers.google.com/data-manager/api/limits#request_limits
export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  default: 10000,
  unsafe_hidden: true,
  required: true
}

export const event_name: InputField = {
  label: 'Event Name',
  description: 'The name of the current Segment event.',
  type: 'string',
  default: {
    '@path': '$.event'
  },
  unsafe_hidden: true
}
