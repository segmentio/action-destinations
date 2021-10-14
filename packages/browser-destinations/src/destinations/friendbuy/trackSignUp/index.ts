import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { FriendbuyAPI } from '..'

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
    default: {
      '@if': {
        exists: { '@path': '$.properties.name' },
        then: { '@path': '$.properties.name' },
        else: { '@template': '{{properties.first_name}} {{properties.last_name}}' }
      }
    }
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
    // console.log('trackSignUp.perform', JSON.stringify(data, null, 2))
    friendbuyAPI.push([
      'track',
      'sign_up',
      {
        id: data.payload.customerId,
        email: data.payload.email,
        firstName: data.payload.firstName,
        lastName: data.payload.lastName,
        name: data.payload.name,
        loyaltyStatus: data.payload.loyaltyStatus
      }
    ])
  }
}

export default action
