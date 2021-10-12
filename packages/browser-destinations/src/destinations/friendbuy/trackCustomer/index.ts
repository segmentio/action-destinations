import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { FriendbuyAPI } from '..'

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Customer',
  description: 'Create a customer in Friendbuy or update it if it exists.',
  defaultSubscription: 'type = "identify"', // see https://segment.com/docs/config-api/fql/
  platform: 'web',
  // https://segment.com/docs/connections/spec/identify/
  // https://segment.com/docs/connections/spec/common/
  fields: {
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
      required: false,
      default: { '@path': '$.traits.email' }
    },
    firstName: {
      label: 'Name',
      description: "The user's given name.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.firstName' }
    },
    lastName: {
      label: 'Name',
      description: "The user's surname.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.lastName' }
    },
    name: {
      label: 'Name',
      description: "The user's full name.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.name' }
    }
  },
  perform: (friendbuyAPI, data) => {
    // console.log('trackCustomer.perform', JSON.stringify({ friendbuyAPI, data }, null, 2))
    friendbuyAPI.push([
      'track',
      'customer',
      {
        id: data.payload.customerId,
        email: data.payload.email,
        firstName: data.payload.firstName,
        lastName: data.payload.lastName,
        name: getName(data.payload)
      }
    ])
  }
}

function getName(payload: Payload): string | undefined {
  // prettier-ignore
  return (
    payload.name                          ? payload.name :
    payload.firstName && payload.lastName ? `${payload.firstName} ${payload.lastName}`
    :                                       undefined
  )
}

export default action
