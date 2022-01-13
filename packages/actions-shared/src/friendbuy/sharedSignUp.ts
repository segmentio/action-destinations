import type { InputField } from '@segment/actions-core'

import { commonCustomerFields } from './commonFields'

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
