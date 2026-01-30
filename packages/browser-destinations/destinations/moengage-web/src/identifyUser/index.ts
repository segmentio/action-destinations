import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MoengageSDK, Identifiers } from '../types'

const action: BrowserActionDefinition<Settings, MoengageSDK, Payload> = {
  title: 'Identify User',
  description: 'Send Segment identify events to Moengage.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    identifiers: {
      label: 'Identifiers',
      description: 'Unique identifiers for the user to be identified in Moengage. This can be a user ID, email, or any other unique identifier.',
      type: 'object',
      required: false,
      additionalProperties: true,
      properties: {
        user_id: {
          label: 'User ID',
          description: 'A unique identifier for the user.',
          type: 'string'
        }, 
        email: {
          label: 'Email',
          description: 'The email address of the user.',
          type: 'string'
        },
        mobile: {
          label: 'Mobile',
          description: 'The mobile number of the user.',
          type: 'string'
        }
      },
      default: {
        user_id: { '@path': '$.userId' },
        email: { '@path': '$.traits.email' },
        mobile: { '@path': '$.traits.phone' }
      }
    }, 
    attributes: {
      label: 'User Attributes',
      description: 'A dictionary of key-value pairs that will be sent as user attributes to Moengage.',
      type: 'object',
      required: false,
      additionalProperties: true, 
      properties: {
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
          description: 'The email address of the user.',
          type: 'string'
        },
        mobile: {
          label: 'Mobile',
          description: 'The mobile number of the user.',
          type: 'string'
        },
        username: {
          label: 'Username',
          description: 'The username of the user.',
          type: 'string'
        },
        gender: {
          label: 'Gender',
          description: 'The gender of the user.',
          type: 'string'
        }, 
        birthday: {
          label: 'Birthday',
          description: 'The birthday of the user in ISO 8601 format (YYYY-MM-DD).',
          type: 'string',
          format: 'date'
        }
      },
      default: {
        first_name: { '@path': '$.traits.first_name' },
        last_name: { '@path': '$.traits.last_name' },
        email: { '@path': '$.traits.email' },
        mobile: { '@path': '$.traits.phone' },
        username: { '@path': '$.traits.username' },
        gender: { '@path': '$.traits.gender' },
        birthday: { '@path': '$.traits.birthday' }
      }
    }
  },
  perform: (client, { payload }) => {
    const { 
      identifiers, 
      attributes: {
        first_name,
        last_name,
        email,
        mobile,
        username,
        gender,
        birthday,
        ...otherAttributes
      } = {}
    } = payload

    const numIds = Object.entries(identifiers || {}).length
    const userId = identifiers?.user_id

    if(numIds === 1 && userId) {
      return client.identifyUser(userId)
    }
    else if (numIds > 0 && identifiers) {
      return client.identifyUser(identifiers as Identifiers)
    }
    if(first_name) {
      client.add_first_name(first_name)
    }
    if(last_name) {
      client.add_last_name(last_name)
    }
    if(email) {
      client.add_email(email)
    }
    if(mobile) {
      client.add_mobile(mobile)
    }
    if(username) {
      client.add_user_name(username)
    }
    if(gender) {
      client.add_gender(gender)
    }
    if(birthday) {
      const date = new Date(birthday)
      if(!isNaN(date.getTime())) {
        client.add_birthday(date)
      }
    }
    if(Object.keys(otherAttributes).length > 0) {
      Object.entries(otherAttributes).forEach(([key, value]) => {
        client.add_user_attribute(key, value)
      })
    }
  }
}

export default action
