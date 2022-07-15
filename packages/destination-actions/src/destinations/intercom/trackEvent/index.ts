import type { ActionDefinition } from '@segment/actions-core'
import dayjs from '../../../lib/dayjs'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Submit a data event to Intercom.',
  fields: {
    event_name: {
      type: 'string',
      required: true,
      description:
        'The name of the event. Names are treated as case insensitive. Periods (.) and dollars ($) in event names are replaced with hyphens.',
      label: 'Event Name',
      default: {
        '@path': '$.event'
      }
    },
    created_at: {
      type: 'datetime',
      required: true,
      description: 'A datetime in Unix timestamp format (seconds since Epoch).',
      label: 'Created At',
      default: {
        '@path': '$.timestamp'
      }
    },
    user_id: {
      type: 'string',
      description: "The user's ID; required if no email provided.",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      type: 'string',
      description: "The user's email; required if no User ID provided.",
      label: 'Email',
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    metadata: {
      type: 'object',
      description:
        'Metadata object describing the event. There is a limit to 10 keys. Intercom does not currently support nested JSON structures.',
      label: 'Metadata',
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

function convertValidTimestamp(value: string | number): string | number {
  // Timestamps may be on a `string` field, so check if the string is only
  // numbers. If it is, ignore it since it's probably already a unix timestamp.
  // DayJS doesn't parse unix timestamps correctly outside of the `.unix()`
  // initializer.
  if (typeof value !== 'string' || /^\d+$/.test(value)) {
    return value
  }

  const maybeDate = dayjs.utc(value)

  if (maybeDate.isValid()) {
    return maybeDate.unix()
  }

  return value
}

export default action
