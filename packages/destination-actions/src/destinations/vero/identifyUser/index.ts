import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../constants'
import { TIMEZONE_CHOICES } from './constants'
import { user_id, email, created_at } from '../properties'
import { buildJSON } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Create or update a user in Vero.',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: user_id,
    email: {
      ...email,
      default: { '@path': '$.traits.email' }
    },
    userProperties: {
      label: 'User Properties',
      description:
        'Properties to set on the user. Computed traits can be mapped here. All values are sent to Vero as strings.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.traits' }
    },
    timezone: {
      label: 'Timezone',
      description: 'The timezone of the user, as a UTC offset in hours.',
      type: 'number',
      choices: TIMEZONE_CHOICES
    },
    language: {
      label: 'Language',
      description: 'The language of the user.',
      type: 'string',
      default: { '@path': '$.context.locale' }
    },
    userAgent: {
      label: 'User Agent',
      description: 'The user agent of the user.',
      type: 'string',
      default: { '@path': '$.context.userAgent' }
    },
    pushDevices: {
      label: 'Push Devices',
      description: 'Push notification devices to register for the user.',
      type: 'object',
      multiple: true,
      additionalProperties: false,
      defaultObjectUI: 'arrayeditor',
      properties: {
        token: {
          label: 'Device Token',
          description: 'The push token of the device.',
          type: 'string',
          required: true
        },
        platform: {
          label: 'Platform',
          description: 'The platform of the device.',
          type: 'string',
          required: true,
          choices: [
            { label: 'iOS', value: 'ios' },
            { label: 'Android', value: 'android' }
          ]
        }
      }
    },
    createdAt: {
      ...created_at,
      label: 'Created At',
      description: 'When the user was created. Sent to Vero as an ISO 8601 string.'
    },
    updateOnly: {
      label: 'Update Only',
      description: 'If enabled, Vero will only update existing users and will not create new ones.',
      type: 'boolean',
      default: false
    },
    topicPreferences: {
      label: 'Topic Preferences',
      description: 'Subscription topic preferences for the user. Provide a topic ID or a topic name, and a status.',
      type: 'object',
      multiple: true,
      additionalProperties: false,
      defaultObjectUI: 'arrayeditor',
      properties: {
        id: {
          label: 'Topic ID',
          description: 'The ID of the topic in Vero.',
          type: 'integer',
          minimum: 1
        },
        name: {
          label: 'Topic Name',
          description: 'The name of the topic in Vero. Provide either a Topic ID or a Topic Name, not both.',
          type: 'string'
        },
        status: {
          label: 'Status',
          description: 'The subscription status for the topic.',
          type: 'string',
          required: true,
          choices: [
            { label: 'Subscribed', value: 'subscribed' },
            { label: 'Unsubscribed', value: 'unsubscribed' }
          ]
        }
      }
    }
  },
  perform: (request, { payload }) => {
    return request(`${API_URL}/users/track`, {
      method: 'post',
      json: buildJSON(payload)
    })
  }
}

export default action
