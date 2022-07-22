import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { convertValidTimestamp } from '../util'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Submit an event to Intercom.',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name: {
      type: 'string',
      required: true,
      description:
        'The name of the event that occurred. Names are treated as case insensitive. Periods and dollar signs in event names are replaced with hyphens.',
      label: 'Event Name',
      default: {
        '@path': '$.event'
      }
    },
    created_at: {
      type: 'datetime',
      required: true,
      description:
        'The time the event occurred as a UTC Unix timestamp. Segment will convert to Unix if not already converted.',
      label: 'Event Timestamp',
      default: {
        '@path': '$.timestamp'
      }
    },
    user_id: {
      type: 'string',
      description: 'Your identifier for the user who performed the event. User ID is required if no email is provided.',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      type: 'string',
      description:
        'The email address for the user who performed the event. Email is required if no User ID is provided.',
      label: 'Email Address',
      format: 'email',
      default: {
        '@path': '$.properties.email'
      }
    },
    id: {
      type: 'string',
      description: '',
      label: 'Contact ID'
    },
    metadata: {
      type: 'object',
      description:
        'Optional metadata describing the event. Each event can contain up to ten metadata key-value pairs. If you send more than ten keys, Intercom will ignore the rest. Intercom does not support nested JSON structures within metadata.',
      label: 'Event Metadata',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (request, { payload }) => {
    payload.created_at = convertValidTimestamp(payload.created_at)
    delete payload.metadata?.email
    return request('https://api.intercom.io/events', {
      method: 'POST',
      json: payload
    })
  }
}

export default action
