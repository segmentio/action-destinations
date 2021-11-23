import type { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonCustomerAttributes, commonCustomerFields } from '../shared/commonFields'
import { createFriendbuyPayload, filterFriendbuyAttributes } from '../shared/util'

// see https://segment.com/docs/config-api/fql/
export const trackSignUpDefaultSubscription = 'event = "Signed Up"'

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

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Sign Up',
  description: 'Record when a customer signs up for a service.',
  defaultSubscription: trackSignUpDefaultSubscription,
  platform: 'web',
  fields: trackSignUpFields,

  perform: (friendbuyAPI, data) => {
    // The track sign_up call is like track customer in that customer
    // properties are passed in the root of the event.
    const [nonCustomerPayload, customerAttributes] = commonCustomerAttributes(data.payload)
    const friendbuyPayload = createFriendbuyPayload([
      ...customerAttributes,
      // custom properties
      ...filterFriendbuyAttributes(nonCustomerPayload.friendbuyAttributes)
    ])
    friendbuyAPI.push(['track', 'sign_up', friendbuyPayload, true])
  }
}

export default action
