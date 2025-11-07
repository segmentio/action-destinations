import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Mixpanel } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Mixpanel, Payload> = {
  title: 'Identify',
  description: 'Sync Segment identify calls to Mixpanel.',
  platform: 'web',
  fields: {
    unique_id: {
      label: 'Unique ID',
      description: 'The unique ID to associate with the user.',
      required: true,
      type: 'string',
      default: { '@path': '$.userId' }
    },
    profile_properties_to_set: {
      label: 'Profile Properties to Set',
      description: 'User Profile Properties to set on the user profile in Mixpanel.',
      required: false,
      defaultObjectUI: 'keyvalue',
      additionalProperties: true,
      type: 'object',
      properties: {
        name: {
          label: 'Name',
          description: 'The name of the user.',
          type: 'string'
        },
        first_name: {
          label: 'First Name',
          description: 'The first name of the user.',
          type: 'string'
        },
        last_name: {
          label: 'Last Name',
          description: 'The last name of the user.',
          type: 'string'
        },
        email: {
          label: 'Email',
          description: 'The email of the user.',
          type: 'string',
          format: 'email'
        },
        phone: {
          label: 'Phone',
          description: 'The phone number of the user.',
          type: 'string'
        },
        avatar: {
          label: 'Avatar',
          description: 'The avatar URL of the user.',
          type: 'string',
          format: 'uri'
        },
        created: {
          label: 'Created',
          description: 'The creation date of the user profile.',
          type: 'string',
          format: 'date-time'
        }
      },
      default: { '@path': '$.traits' }
    },
    profile_properties_to_set_once: {
      label: 'Profile Properties to Set Once',
      description: 'User Profile Properties to set once on the user profile in Mixpanel. Values which get set once cannot be overwritten later.',
      required: false,
      defaultObjectUI: 'keyvalue',
      type: 'object'
    },
    profile_properties_to_increment: {
      label: 'Profile Properties to Increment',
      description: 'User Profile Properties to increment on the user profile in Mixpanel. Values must be numeric.',
      required: false,
      defaultObjectUI: 'keyvalue',
      type: 'object'
    }
    // TODO - maybe allow anonymousId and userId in Mixpanel to be set directly from track calls. 
  },
  defaultSubscription: 'type = "identify"',
  perform: (mixpanel, { payload }) => {
    const { 
      unique_id, 
      profile_properties_to_set, 
      profile_properties_to_set_once, 
      profile_properties_to_increment 
    } = payload
    
    mixpanel.identify(unique_id)

    if (profile_properties_to_set && Object.keys(profile_properties_to_set).length > 0) {
      mixpanel.people.set(profile_properties_to_set)
    }

    if (profile_properties_to_set_once && Object.keys(profile_properties_to_set_once).length > 0) {
      mixpanel.people.set_once(profile_properties_to_set_once)
    }

    if (profile_properties_to_increment && Object.keys(profile_properties_to_increment).length > 0) {
      mixpanel.people.increment(profile_properties_to_increment)
    }
  }
}

export default action
