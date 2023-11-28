import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Submit an event to Gleap.',
  defaultSubscription: 'type = "track"',
  fields: {
    eventName: {
      type: 'string',
      required: true,
      description:
        'The name of the event that occurred. Names are treated as case insensitive. Periods and dollar signs in event names are replaced with hyphens.',
      label: 'Event Name',
      default: {
        '@path': '$.event'
      }
    },
    date: {
      type: 'datetime',
      required: true,
      description:
        'The time the event occurred as a UTC Unix timestamp. Segment will convert to Unix if not already converted.',
      label: 'Event Timestamp',
      default: {
        '@path': '$.timestamp'
      }
    },
    userId: {
      type: 'string',
      required: true,
      description: 'Your identifier for the user who performed the event. User ID is required.',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    data: {
      type: 'object',
      description:
        'Optional metadata describing the event. Each event can contain up to ten metadata key-value pairs. If you send more than ten keys, Gleap will ignore the rest.',
      label: 'Event Metadata',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: async (request, { payload }) => {
    const event = {
      name: payload.eventName,
      date: payload.date,
      data: payload.data,
      userId: payload.userId
    }

    return request('https://api.gleap.io/admin/track', {
      method: 'POST',
      json: {
        events: [event]
      }
    })
  }
}

export default action
