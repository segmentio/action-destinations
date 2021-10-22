import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { FriendbuyAPI } from '..'
import { getName } from '../util'
import { createFriendbuyPayload } from '../util'

// see https://segment.com/docs/config-api/fql/
export const trackSignUpDefaultSubscription = 'event = "Signed Up"'

// https://segment.com/docs/connections/spec/b2b-saas/#signed-up
export const trackSignUpFields: Record<string, InputField> = {
  customerId: {
    label: 'Customer ID',
    description: "The user's customerId.",
    type: 'string',
    required: true,
    default: { '@path': '$.userId' }
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
  }
}

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Sign Up',
  description: 'Record when a user signs up for an account.',
  defaultSubscription: trackSignUpDefaultSubscription,
  platform: 'web',
  fields: trackSignUpFields,

  perform: (friendbuyAPI, data) => {
    // console.log('trackSignUp.perform', JSON.stringify(data.payload, null, 2))
    const friendbuyPayload = createFriendbuyPayload([
      ['id', data.payload.customerId],
      ['email', data.payload.email],
      ['firstName', data.payload.firstName],
      ['lastName', data.payload.lastName],
      ['name', getName(data.payload)],
      ['age', data.payload.age],
      ['loyaltyStatus', data.payload.loyaltyStatus]
    ])
    // console.log('friendbuyPayload', JSON.stringify(friendbuyPayload, null, 2))
    friendbuyAPI.push(['track', 'sign_up', friendbuyPayload])
  }
}

export default action
