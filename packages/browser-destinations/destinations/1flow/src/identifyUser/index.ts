import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { _1Flow } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, _1Flow, Payload> = {
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
    anonymousId: {
      description: 'An anonymous identifier for the user.',
      label: 'Anonymous ID',
      type: 'string',
      required: false,
      default: {
        '@path': '$.anonymousId'
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
        '@path': '$.traits.first_name'
      }
    },
    last_name: {
      description: "The user's last name.",
      label: 'First Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.last_name'
      }
    },
    phone: {
      description: "The user's phone number.",
      label: 'Phone Number',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.phone'
      }
    },

    email: {
      description: "The user's email address.",
      label: 'Email Address',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    }
  },
  perform: (_1Flow, event) => {
    const { userId, anonymousId, traits, first_name, last_name, phone, email } = event.payload
    _1Flow('identify', userId, anonymousId, {
      ...traits,
      first_name: first_name,
      last_name: last_name,
      phone: phone,
      email: email
    })
  }
}

export default action
