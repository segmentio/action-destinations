import { InputField } from '@segment/actions-core/index'

export const external_id: InputField = {
  label: 'External ID',
  description: 'The ID of the DV360 Audience.',
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

export const emails: InputField = {
  label: 'Emails',
  description: `A list of the user's emails. If not already hashed, the system will hash them before use.`,
  type: 'string',
  default: {
    '@path': '$.context.traits.emails'
  }
}

export const phoneNumbers: InputField = {
  label: 'Phone Numbers',
  description: `A list of the user's phone numbers. If not already hashed, the system will hash them before use.`,
  type: 'string',
  default: {
    '@path': '$.context.traits.phoneNumbers'
  }
}

export const zipCodes: InputField = {
  label: 'ZIP Codes',
  description: `A list of the user's zip codes.`,
  type: 'string',
  default: {
    '@path': '$.context.traits.zipCodes'
  }
}

export const firstName: InputField = {
  label: 'First Name',
  description: `The user's first name. If not already hashed, the system will hash it before use.`,
  type: 'string',
  default: {
    '@path': '$.context.traits.firstName'
  }
}

export const lastName: InputField = {
  label: 'Last Name',
  description: `The user's last name. If not already hashed, the system will hash it before use.`,
  type: 'string',
  default: {
    '@path': '$.context.traits.lastName'
  }
}

export const countryCode: InputField = {
  label: 'Country Code',
  description: `The country code of the user.`,
  type: 'string',
  default: {
    '@path': '$.context.traits..countryCode'
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

//Max set based on google documenation maximum: https://developers.google.com/display-video/api/reference/rest/v3/firstAndThirdPartyAudiences#ContactInfo
export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  default: 500000,
  unsafe_hidden: true,
  required: true
}
