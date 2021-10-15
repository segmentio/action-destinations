import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { FriendbuyAPI } from '..'
import { getName } from '../util'

// see https://segment.com/docs/config-api/fql/
export const trackCustomerDefaultSubscription = 'type = "identify"'

// https://segment.com/docs/connections/spec/identify/
// https://segment.com/docs/connections/spec/common/
export const trackCustomerFields: Record<string, InputField> = {
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
  }
}

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Customer',
  description: 'Create a customer in Friendbuy or update it if it exists.',
  defaultSubscription: trackCustomerDefaultSubscription,
  platform: 'web',
  fields: trackCustomerFields,

  perform: (friendbuyAPI, data) => {
    // console.log('trackCustomer.perform', JSON.stringify({ data }, null, 2))
    friendbuyAPI.push([
      'track',
      'customer',
      {
        id: data.payload.customerId,
        email: data.payload.email,
        firstName: data.payload.firstName,
        lastName: data.payload.lastName,
        name: getName(data.payload),
        age: data.payload.age
      }
    ])
  }
}

export default action
