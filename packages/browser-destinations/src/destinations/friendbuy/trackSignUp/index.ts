import type { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createFriendbuyPayload, filterFriendbuyAttributes, getName } from '../util'

// see https://segment.com/docs/config-api/fql/
export const trackSignUpDefaultSubscription = 'event = "Signed Up"'

// https://segment.com/docs/connections/spec/b2b-saas/#signed-up
export const trackSignUpFields: Record<string, InputField> = {
  customerId: {
    label: 'Customer ID',
    description: "The user's customer ID.",
    type: 'string',
    required: true,
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
    required: true,
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
  },
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
    const friendbuyPayload = createFriendbuyPayload([
      ['id', data.payload.customerId],
      ['email', data.payload.email],
      ['firstName', data.payload.firstName],
      ['lastName', data.payload.lastName],
      ['name', getName(data.payload)],
      ['age', data.payload.age],
      ['loyaltyStatus', data.payload.loyaltyStatus],
      // custom properties
      ['anonymousId', data.payload.anonymousId],
      ...filterFriendbuyAttributes(data.payload.friendbuyAttributes)
    ])
    friendbuyAPI.push(['track', 'sign_up', friendbuyPayload, true])
  }
}

export default action
