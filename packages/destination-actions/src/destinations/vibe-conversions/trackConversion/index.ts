import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { EVENT_TYPES } from '../constants'
import { sendEvent } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion',
  description: 'Send a conversion event to Vibe.',
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    a: {
      label: 'Event Type',
      description: 'The action/event type that was performed.',
      type: 'string',
      required: true,
      choices: EVENT_TYPES.map((value) => ({ label: value, value }))
    },
    eid: {
      label: 'Event ID',
      description:
        'Unique event ID. Must be unique for each event. UUID format is recommended. Defaults to the Segment messageId.',
      type: 'string',
      required: true,
      default: { '@path': '$.messageId' }
    },
    ts: {
      label: 'Timestamp',
      description:
        'Timestamp of the event, in ISO 8601 format or UNIX milliseconds. Must be within the last 7 days. Sent to Vibe as UNIX milliseconds.',
      type: 'datetime',
      required: false,
      default: { '@path': '$.timestamp' }
    },
    ip: {
      label: 'IP Address',
      description: 'IP address of the user who performed the action. Must be IPv4. Required if Email is not provided.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.ip' }
    },
    em: {
      label: 'Email',
      description: 'User email address. Required if IP Address is not provided.',
      type: 'string',
      format: 'email',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    ed: {
      label: 'Event Data',
      description:
        'Event data. Reserved attributes are price_usd (float) and purchase_id (string). Sent to Vibe as a stringified JSON object.',
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    gid: {
      label: 'Google Analytics ID',
      description: 'Google Analytics ID for cross-platform attribution.',
      type: 'string',
      required: false
    },
    ua: {
      label: 'User Agent',
      description: 'User Agent string.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.userAgent' }
    },
    url: {
      label: 'Page URL',
      description: 'The URL of the page where the action occurred.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.page.url' }
    }
  },
  // Vibe's conversion API has no batch endpoint, so only a single-event
  // `perform` is implemented (no `performBatch`).
  perform: (request, { payload, settings }) => {
    return sendEvent(request, settings, payload)
  }
}

export default action
