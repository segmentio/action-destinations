import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { EVENT_TYPES } from '../constants'
import { sendEvent, sendBatch } from '../utils'

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
        'Event data. Sent to Vibe as a stringified JSON object. The reserved attributes Price (USD) and Purchase ID are merged into this object.',
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    price_usd: {
      label: 'Price (USD)',
      description:
        'Reserved event-data attribute: the price of the conversion in USD. Merged into Event Data as `price_usd`.',
      type: 'number',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties.price_usd' },
          then: { '@path': '$.properties.price_usd' },
          else: { '@path': '$.properties.price' }
        }
      }
    },
    purchase_id: {
      label: 'Purchase ID',
      description:
        'Reserved event-data attribute: a unique identifier for the purchase. Merged into Event Data as `purchase_id`.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties.purchase_id' },
          then: { '@path': '$.properties.purchase_id' },
          else: { '@path': '$.properties.order_id' }
        }
      }
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
    },
    enable_batching: {
      label: 'Batch Data',
      description: 'When enabled, Segment groups events before delivering them to this destination.',
      type: 'boolean',
      required: false,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      required: false,
      unsafe_hidden: true,
      default: 1000
    }
  },
  perform: (request, { payload, settings }) => {
    return sendEvent(request, settings, payload)
  },
  // Vibe's conversion API has no batch endpoint. When batching is enabled,
  // events are sent as individual requests (one per event) with per-event
  // error isolation via a MultiStatusResponse.
  performBatch: (request, { payload, settings }) => {
    return sendBatch(request, settings, payload)
  }
}

export default action
