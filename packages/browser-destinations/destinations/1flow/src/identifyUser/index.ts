import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { _1flow } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, _1flow, Payload> = {
  title: 'Identify User',
  description: 'Create or update a user in 1Flow.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    userId: {
      description: 'A unique identifier for the user.',
      label: 'User ID',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      description: "The user's custom attributes.",
      label: 'Custom Attributes',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue',
      default: {
        '@path': '$.traits'
      }
    },
    first_name: {
      description: "The user's first name.",
      label: 'First Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.first_name'
      }
    },
    last_name: {
      description: "The user's last name.",
      label: 'First Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.last_name'
      }
    },
    phone: {
      description: "The user's phone number.",
      label: 'Phone Number',
      type: 'string',
      required: false,
      default: {
        '@path': '$.phone'
      }
    },

    email: {
      description: "The user's email address.",
      label: 'Email Address',
      type: 'string',
      required: false,
      default: {
        '@path': '$.email'
      }
    }
  },
  perform: (_1flow, event) => {
    const { userId, traits, first_name, last_name, phone, email } = event.payload
    _1flow('identify', userId, {
      ...traits,
      first_name: first_name,
      last_name: last_name,
      phone: phone,
      email: email
    })
  }
}

export default action
