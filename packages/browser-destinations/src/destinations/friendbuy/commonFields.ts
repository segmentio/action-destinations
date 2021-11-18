import type { InputField } from '@segment/actions-core'

import { getName } from './util'

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
      default: { '@path': '$.userId' }
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
    firstName: {
      label: 'First Name',
      description: "The user's given name.",
      type: 'string',
      required: false,
      default: { '@path': '$.properties.first_name' }
    },
    lastName: {
      label: 'Last Name',
      description: "The user's surname.",
      type: 'string',
      required: false,
      default: { '@path': '$.properties.last_name' }
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
    loyaltyStatus: {
      label: 'Loyalty Program Status',
      description: 'The status of the user in your loyalty program. Valid values are "in", "out", or "blocked".',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.loyaltyStatus' }
    }
  }
}

export interface CommonCustomerPayload {
  customerId?: string
  anonymousId?: string
  email?: string
  firstName?: string
  lastName?: string
  name?: string
  age?: number
  loyaltyStatus?: string
}

export function commonCustomerAttributes(payload: CommonCustomerPayload): [string, any][] {
  // Don't send any customer data unless we have at least a customer ID.
  return typeof payload.customerId !== 'string' || payload.customerId === ''
    ? []
    : [
        ['id', payload.customerId],
        ['email', payload.email],
        ['firstName', payload.firstName],
        ['lastName', payload.lastName],
        ['name', getName(payload)],
        ['age', payload.age],
        ['loyaltyStatus', payload.loyaltyStatus],
        // custom properties
        ['anonymousId', payload.anonymousId]
      ]
}
