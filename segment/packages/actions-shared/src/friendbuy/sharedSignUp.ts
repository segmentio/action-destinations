import type { InputField } from '@segment/actions-core'
import type { FieldConfig } from './commonFields'

import { commonCustomerFields } from './commonFields'

// https://segment.com/docs/connections/spec/b2b-saas/#signed-up
export const trackSignUpFields = (fieldConfig: FieldConfig): Record<string, InputField> => ({
  ...commonCustomerFields(fieldConfig),
  coupon: {
    label: 'Coupon Code',
    description: 'Coupon code that customer supplied when they signed up.',
    type: 'string',
    required: false,
    default: { '@path': '$.properties.coupon' }
  },
  attributionId: {
    label: 'Friendbuy Attribution ID',
    description:
      'Friendbuy attribution ID that associates the customer who is signing up with the advocate who referred them.',
    type: 'string',
    required: false,
    default: { '@path': '$.properties.attributionId' }
  },
  referralCode: {
    label: 'Friendbuy Referral ID',
    description:
      'Friendbuy referral code that associates the customer who is signing up with the advocate who referred them.',
    type: 'string',
    required: false,
    default: { '@path': '$.properties.referralCode' }
  },
  friendbuyAttributes: {
    label: 'Custom Attributes',
    description:
      'Custom attributes to send to Friendbuy. You should pass an object whose keys are the names of the custom attributes and whose values are strings. Non-string-valued attributes will be dropped.',
    type: 'object',
    required: false,
    default: { '@path': '$.properties.friendbuyAttributes' }
  }
})
