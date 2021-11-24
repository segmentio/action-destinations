import type { InputField } from '@segment/actions-core'

import { createFriendbuyPayload, filterFriendbuyAttributes, getName } from './util'

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

export interface AnalyticsCustomerPayload {
  customerId: string
  anonymousId?: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  age?: number
  customerSince?: string
  loyaltyStatus?: string
  isNewCustomer?: boolean
  friendbuyAttributes?: { [k: string]: unknown }
}

export function createCustomerPayload(analyticsPayload: AnalyticsCustomerPayload) {
  const friendbuyPayload = createFriendbuyPayload([
    ['id', analyticsPayload.customerId],
    ['email', analyticsPayload.email],
    ['firstName', analyticsPayload.firstName],
    ['lastName', analyticsPayload.lastName],
    ['name', getName(analyticsPayload)],
    ['age', analyticsPayload.age],
    ['customerSince', analyticsPayload.customerSince],
    ['loyaltyStatus', analyticsPayload.loyaltyStatus],
    ['isNewCustomer', analyticsPayload.isNewCustomer],
    // custom properties
    ['anonymousId', analyticsPayload.anonymousId],
    ...filterFriendbuyAttributes(analyticsPayload.friendbuyAttributes)
  ])

  return friendbuyPayload
}
