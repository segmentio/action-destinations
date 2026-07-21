import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type SendEventPayload = {
  email?: string
  eventName: string
  userId: string
  eventProperties?: Record<string, string | number | boolean>
} & Record<string, string | number | boolean | null>

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
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
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
    },
    contactProperties: {
      label: 'Contact Properties',
      description: "Optional properties that will be updated on the event's contact.",
      type: 'object',
      required: false
    },
    eventProperties: {
      label: 'Event Properties',
      description: 'Event-specific properties that can be included in emails triggered by this event.',
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    }
  },
  perform: (request, { payload }) => {
    return request('https://app.loops.so/api/v1/events/send', {
      method: 'post',
      json: {
        email: payload.email,
        eventName: payload.eventName,
        userId: payload.userId,
        eventProperties: payload.eventProperties,
        ...(typeof payload.contactProperties === 'object' && payload.contactProperties)
      } as SendEventPayload
    })
  }
}

export default action
