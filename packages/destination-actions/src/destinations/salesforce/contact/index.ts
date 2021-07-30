import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Contact',
  description: 'Create a Contact on Salesforce',
  defaultSubscription: 'type = "identify"',
  fields: {
    first_name: {
      label: 'First Name',
      description: "Contact's first name",
      type: 'string',
      default: {
        '@path': '$.traits.firstName'
      }
    },
    last_name: {
      label: 'Last Name',
      description: "Contact's last name",
      type: 'string',
      required: true,
      default: {
        '@path': '$.traits.lastName'
      }
    },
    email: {
      label: 'Email Address',
      description: "Contact's email address.",
      type: 'string',
      default: {
        '@path': '$.traits.email'
      }
    },
    phone: {
      label: 'Phone Number',
      description: 'Phone number for the contact.',
      type: 'string',
      default: {
        '@path': '$.traits.phone'
      }
    },
    title: {
      label: 'Title',
      description: 'Title for the contact.',
      type: 'string',
      default: {
        '@path': '$.traits.title'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    return request(`${settings.instance_url}/services/data/v52.0/sobjects/Contact`, {
      method: 'post',
      json: payload
    })
  }
}

export default action
