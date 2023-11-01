import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { _1Flow } from '../api'
import type { Settings } from '../generated-types'
import { filterCustomTraits } from '../utils'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, _1Flow, Payload> = {
  title: 'Identify User',
  description: 'Create or update a user in 1Flow.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    user_id: {
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
      defaultObjectUI: 'keyvalue'
    },
    name: {
      description: "The user's name.",
      label: 'Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
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
    // remove properties that require extra handling
    const { user_id, traits } = event.payload

    // Ensure the user_id is provided and non-empty
    if (!user_id) {
      throw new Error('User ID is required.')
    }
    // drop custom objects & arrays
    const filteredCustomTraits = filterCustomTraits(traits)

    // API call
    _1Flow('identify', user_id, {
      ...filteredCustomTraits
    })
  }
}

export default action
