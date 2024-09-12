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

export const emails: InputField = {
  label: 'Emails',
  description: `A list of the user's emails. If not already hashed, the system will hash them before use.`,
  type: 'string',
  default: {
    '@path': '$.properties.emails'
  }
}

export const phoneNumbers: InputField = {
  label: 'Phone Numbers',
  description: `A list of the user's phone numbers. If not already hashed, the system will hash them before use.`,
  type: 'string',
  default: {
    '@path': '$.properties.phoneNumbers'
  }
}

export const zipCodes: InputField = {
  label: 'ZIP Codes',
  description: `A list of the user's zip codes.`,
  type: 'string',
  default: {
    '@path': '$.properties.zipCodes'
  }
}

export const firstName: InputField = {
  label: 'First Name',
  description: `The user's first name. If not already hashed, the system will hash it before use.`,
  type: 'string',
  default: {
    '@path': '$.properties.firstName'
  }
}

export const lastName: InputField = {
  label: 'Last Name',
  description: `The user's last name. If not already hashed, the system will hash it before use.`,
  type: 'string',
  default: {
    '@path': '$.properties.lastName'
  }
}

export const countryCode: InputField = {
  label: 'Country Code',
  description: `The country code of the user.`,
  type: 'string',
  default: {
    '@path': '$.properties.countryCode'
  }
}

export const mobileDeviceIds: InputField = {
  label: 'Mobile Device IDs',
  description: `A list of mobile device IDs defining Customer Match audience members. The size of mobileDeviceIds mustn't be greater than 500,000.`,
  type: 'string',
  default: {
    '@path': '$.properties.mobileDeviceIds'
  }
}
