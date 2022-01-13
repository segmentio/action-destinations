import type { InputField } from '@segment/actions-core'

export type FriendbuyAPI = 'pub' | 'mapi'

export function commonCustomerFields(requireIdAndEmail: boolean): Record<string, InputField> {
  // If we want to associate an event such as a purchase with an existing
  // customer then the customerId is required.  If we want to create a new
  // customer from the event if one doesn't already exist then additionally an
  // email address is required.
  return {
    customerId: {
      label: 'Customer ID',
      description: "The user's customer ID.",
      type: 'string',
      required: requireIdAndEmail,
      default: {
        // We hope that we have a userId because analytics.identify has been
        // called but, if not, allow a customerId to be specified in the
        // event.  If one is specified, it overrides the one from the identify
        // call.
        '@if': {
          exists: { '@path': '$.properties.customerId' },
          then: { '@path': '$.properties.customerId' },
          else: { '@path': '$.userId' }
        }
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: "The user's anonymous ID.",
      type: 'string',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    email: {
      label: 'Email',
      description: "The user's email address.",
      type: 'string',
      required: requireIdAndEmail,
      default: { '@path': '$.properties.email' }
    },
    isNewCustomer: {
      label: 'New Customer Flag',
      description: 'Flag to indicate whether the user is a new customer.',
      type: 'boolean',
      required: false,
      default: { '@path': '$.properties.isNewCustomer' }
    },
    loyaltyStatus: {
      label: 'Loyalty Program Status',
      description: 'The status of the user in your loyalty program. Valid values are "in", "out", or "blocked".',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.loyaltyStatus' }
    },
    firstName: {
      label: 'First Name',
      description: "The user's given name.",
      type: 'string',
      required: false,
      default: { '@path': '$.properties.firstName' }
    },
    lastName: {
      label: 'Last Name',
      description: "The user's surname.",
      type: 'string',
      required: false,
      default: { '@path': '$.properties.lastName' }
    },
    name: {
      label: 'Name',
      description: "The user's full name.",
      type: 'string',
      required: false,
      default: { '@path': '$.properties.name' }
    },
    age: {
      label: 'Age',
      description: "The user's age.",
      type: 'number',
      required: false,
      default: { '@path': '$.properties.age' }
    },
    birthday: {
      label: 'Birthday',
      description: 'The user\'s birthday in the format "YYYY-MM-DD", or "0000-MM-DD" to omit the year.',
      type: 'string',
      format: 'date',
      default: { '@path': '$.properties.birthday' }
    }
  }
}
