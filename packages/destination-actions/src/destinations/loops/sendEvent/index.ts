import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Send an event for a contact in Loops',
  defaultSubscription: 'type = "track"',

  fields: {
    email: {
      label: 'Contact Email',
      description: 'Email address for the contact.',
      type: 'string',
      format: 'email',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.email' }
        }
      }
    },
    eventName: {
      label: 'Event Name',
      description: 'Name of the event.',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
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
    return request('https://app.loops.so/api/v1/events/send', {
      method: 'post',
      json: {
        email: payload.email,
        eventName: payload.eventName,
        userId: payload.userId
      }
    })
  }
}

export default action
