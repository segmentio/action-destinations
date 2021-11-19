import type { InputField } from '@segment/actions-core'
import type { FriendbuyPayloadItem } from './util'

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

/**
 * Extracts the customer fields from a payload and returns a tuple whose first
 * element is the payload without the customer fields, and second element is
 * the customer attributes.
 */
export function commonCustomerAttributes<T extends CommonCustomerPayload>(
  payload: T
): [Omit<T, keyof CommonCustomerPayload>, FriendbuyPayloadItem[]] {
  const payloadWithoutCustomer = { ...payload }
  const customerAttributes: FriendbuyPayloadItem[] = []

  const copyField = (from: keyof CommonCustomerPayload, to?: string) => {
    if (from in payloadWithoutCustomer) {
      if (payloadWithoutCustomer[from] !== undefined) {
        customerAttributes.push([to || from, payloadWithoutCustomer[from]])
      }
      delete payloadWithoutCustomer[from]
    }
  }

  copyField('customerId', 'id')
  copyField('email')
  copyField('firstName')
  copyField('lastName')
  customerAttributes.push(['name', getName(payload)])
  copyField('age')
  copyField('loyaltyStatus')
  // custom properties
  copyField('anonymousId')

  return [
    payloadWithoutCustomer,
    // Don't send any customer data unless we have at least a customer ID.
    typeof payload.customerId !== 'string' || payload.customerId === '' ? [] : customerAttributes
  ]
}
