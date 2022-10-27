import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or update a contact',
  description: 'Create or update a contact in Loops',
  defaultSubscription: 'type = "identify"',
  fields: {
    email: {
      label: 'Contact Email',
      description: 'Email address for the contact.',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.email' }
        }
      }
    },
    firstName: {
      label: 'First Name',
      description: "The contact's given name.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.firstName' }
    },
    lastName: {
      label: 'Last Name',
      description: "The contact's surname.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.lastName' }
    },
    source: {
      label: 'Source',
      description: "The contact's source.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.source' },
          then: { '@path': '$.traits.source' },
          else: 'Segment'
        }
      }
    },
    userGroup: {
      label: 'User Group',
      description: "The contact's user group.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.lastName' }
    },
    userId: {
      label: 'User ID',
      description: 'User ID for the contact.',
      type: 'string',
      format: 'text',
      required: true,
      default: {
        '@path': '$.userId'
      }
    }
  },
  perform: (request, { payload }) => {
    return request('https://app.loops.so/api/v1/contacts/update', {
      method: 'put',
      json: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        source: payload.source,
        userGroup: payload.userGroup,
        userId: payload.userId
      }
    })
  }
}

export default action
