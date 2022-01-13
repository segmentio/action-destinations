import type { InputField } from '@segment/actions-core'

// https://segment.com/docs/connections/spec/identify/
// https://segment.com/docs/connections/spec/common/
export const trackCustomerFields: Record<string, InputField> = {
  customerId: {
    label: 'Customer ID',
    description: "The user's customer ID.",
    type: 'string',
    required: true,
    default: { '@path': '$.userId' }
  },
  anonymousId: {
    label: 'Anonymous ID',
    description: "The user's anonymous id.",
    type: 'string',
    required: false,
    default: { '@path': '$.anonymousId' }
  },
  email: {
    label: 'Email',
    description: "The user's email address.",
    type: 'string',
    required: true,
    default: { '@path': '$.traits.email' }
  },
  firstName: {
    label: 'First Name',
    description: "The user's given name.",
    type: 'string',
    required: false,
    default: { '@path': '$.traits.firstName' }
  },
  lastName: {
    label: 'Last Name',
    description: "The user's surname.",
    type: 'string',
    required: false,
    default: { '@path': '$.traits.lastName' }
  },
  name: {
    label: 'Name',
    description:
      "The user's full name. If the name trait doesn't exist then it will be automatically derived from the firstName and lastName traits if they are defined.",
    type: 'string',
    required: false,
    default: { '@path': '$.traits.name' }
  },
  age: {
    label: 'Age',
    description: "The user's age.",
    type: 'number',
    required: false,
    default: { '@path': '$.traits.age' }
  },
  birthday: {
    label: 'Birthday',
    description: 'The user\'s birthday in the format "YYYY-MM-DD", or "0000-MM-DD" to omit the year.',
    type: 'string',
    format: 'date',
    required: false,
    default: { '@path': '$.traits.birthday' }
  },
  language: {
    label: 'Language',
    description: "The user's language.",
    type: 'string',
    required: false,
    default: { '@path': '$.traits.language' }
  },
  addressCountry: {
    label: 'Country',
    description: "The user's country.",
    type: 'string',
    required: false,
    default: { '@path': '$.traits.address.country' }
  },
  addressState: {
    label: 'State',
    description: "The user's state.",
    type: 'string',
    required: false,
    default: { '@path': '$.traits.address.state' }
  },
  addressCity: {
    label: 'City',
    description: "The user's city.",
    type: 'string',
    required: false,
    default: { '@path': '$.traits.address.city' }
  },
  addressPostalCode: {
    label: 'State',
    description: "The user's postal code.",
    type: 'string',
    required: false,
    default: { '@path': '$.traits.address.postalCode' }
  },
  customerSince: {
    label: 'Customer Since',
    description: 'The date the user became a customer.',
    type: 'string',
    format: 'date-time',
    required: false,
    default: { '@path': '$.traits.customerSince' }
  },
  loyaltyStatus: {
    label: 'Loyalty Status',
    description: 'The status of the user in your loyalty program. Valid values are "in", "out", or "blocked".',
    type: 'string',
    required: false,
    default: { '@path': '$.traits.loyaltyStatus' }
  },
  isNewCustomer: {
    label: 'New Customer Flag',
    description: 'Flag to indicate whether the user is a new customer.',
    type: 'boolean',
    required: false,
    default: { '@path': '$.traits.isNewCustomer' }
  },
  friendbuyAttributes: {
    label: 'Custom Attributes',
    description:
      'Custom attributes to send to Friendbuy. You should pass an object whose keys are the names of the custom attributes and whose values are strings. Non-string-valued attributes will be dropped.',
    type: 'object',
    required: false,
    default: { '@path': '$.traits.friendbuyAttributes' }
  }
}
