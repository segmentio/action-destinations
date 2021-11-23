import type { InputField } from '@segment/actions-core'

import { commonCustomerAttributes, commonCustomerFields } from './commonFields'
import { createFriendbuyPayload, filterFriendbuyAttributes } from './util'

// https://segment.com/docs/connections/spec/b2b-saas/#signed-up
export const trackSignUpFields: Record<string, InputField> = {
  ...commonCustomerFields(true),
  friendbuyAttributes: {
    label: 'Custom Attributes',
    description:
      'Custom attributes to send to Friendbuy. You should pass an object whose keys are the names of the custom attributes and whose values are strings. Non-string-valued attributes will be dropped.',
    type: 'object',
    required: false,
    default: { '@path': '$.properties.friendbuyAttributes' }
  }
}

export interface AnalyticsSignUpPayload {
  customerId: string
  anonymousId?: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  age?: number
  loyaltyStatus?: string
  friendbuyAttributes?: {
    [k: string]: unknown
  }
}

export function createSignUpPayload(analyticsPayload: AnalyticsSignUpPayload) {
  // The track sign_up call is like track customer in that customer
  // properties are passed in the root of the event.
  const [nonCustomerPayload, customerAttributes] = commonCustomerAttributes(analyticsPayload)
  const friendbuyPayload = createFriendbuyPayload([
    ...customerAttributes,
    // custom properties
    ...filterFriendbuyAttributes(nonCustomerPayload.friendbuyAttributes)
  ])

  return friendbuyPayload
}
