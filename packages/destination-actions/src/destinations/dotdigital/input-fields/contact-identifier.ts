import { ContactIdentifier } from './types';
import { InputField } from '@segment/actions-core'

const emailIdentifier: InputField = {
  label: 'Email Address',
  description: "The contact's email address.",
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.traits.email' },
      then: { '@path': '$.traits.email' },
      else: { '@path': '$.properties.email' }
    }
  },
  depends_on: {
    conditions: [{ fieldKey: 'contactIdentifier', operator: 'is', value: 'email' }]
  },
  required: {
    conditions: [{ fieldKey: 'contactIdentifier', operator: 'is', value: 'email' }]
  }
}

const mobileNumberIdentifier: InputField = {
  label: 'Mobile Number',
  description: "The contact's mobile number.",
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.traits.phone' },
      then: { '@path': '$.traits.phone' },
      else: { '@path': '$.properties.phone' }
    }
  },
  depends_on: {
    conditions: [{ fieldKey: 'contactIdentifier', operator: 'is', value: 'mobile-number' }]
  },
  required: {
    conditions: [{ fieldKey: 'contactIdentifier', operator: 'is', value: 'mobile-number' }]
  }
}

const channelIdentifier: InputField = {
  label: 'Contact Identifier',
  description: 'Select the field to identify contacts',
  type: 'string',
  default: 'email',
  required: true,
  choices: [
    { label: 'Email address', value: 'email' },
    { label: 'Mobile number', value: 'mobile-number' }
  ]
}


export const contactIdentifier:ContactIdentifier = {
  channelIdentifier: channelIdentifier,
  emailIdentifier: emailIdentifier,
  mobileNumberIdentifier: mobileNumberIdentifier,
}
