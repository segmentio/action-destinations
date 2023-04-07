import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Sets user identity variables',
  platform: 'cloud',
  fields: {
    userId: {
      type: 'string',
      required: true,
      description: "The user's id",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: "The user's anonymous id",
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    userEmail: {
      type: 'string',
      required: true,
      description: "The user's email",
      label: 'Email',
      default: {
        '@path': '$.email'
      }
    },
    userCreatedAt: {
      type: 'string',
      required: true,
      description: "The user's created at",
      label: 'Created At',
      default: {
        '@path': '$.created_at'
      }
    },
    userFirstName: {
      type: 'string',
      required: false,
      description: "The user's first name",
      label: 'First Name',
      default: {
        '@path': '$.first_name'
      }
    },
    userLastName: {
      type: 'string',
      required: false,
      description: "The user's last name",
      label: 'Last Name',
      default: {
        '@path': '$.last_name'
      }
    },
    userCustomAttributes: {
      type: 'object',
      required: false,
      description: 'The custom attributes to be forwarded to UserMaven',
      label: 'Custom Attributes',
      default: {
        '@path': '$.custom_attributes'
      }
    },
  },
  perform: (request, { payload, settings }) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
