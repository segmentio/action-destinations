import { ActionDefinition, MultiStatusResponse, ErrorCodes, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { BatchResponse, TatariWebEvent } from './types'
import { applyBatchResponse, buildEvent } from './functions'
import { batchUrl, MAX_BATCH_SIZE, trackUrl } from '../versioning-info'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Web Event',
  description: 'Send a page view, conversion, or custom track event to Tatari Web Events.',
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    event: {
      label: 'Event Name',
      description:
        'Name of the event (e.g. `page`, `add_to_cart`, `purchase`). Defaults to the track event name, or the call type (`page`) for page calls.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.type' }
        }
      }
    },
    timestamp: {
      label: 'Timestamp',
      description:
        'When the event occurred. Sent as RFC 3339 UTC. The Web Events API rejects events dated more than 14 days in the past or 30 minutes in the future.',
      type: 'datetime',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    session_id: {
      label: 'Session ID',
      description:
        'Identifier used to group events from the same browsing session. Defaults to `anonymousId` (a device identifier).',
      type: 'string',
      required: true,
      default: { '@path': '$.anonymousId' }
    },
    user_id: {
      label: 'User ID',
      description: 'The identifier for the logged-in user, if known.',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    distinct_id: {
      label: 'Distinct ID',
      description: 'Deduplication key. Defaults to the Segment `messageId`.',
      type: 'string',
      required: false,
      default: { '@path': '$.messageId' }
    },
    ip_address: {
      label: 'IP Address',
      description:
        'IPv4 or IPv6 address of the end user. Required by Tatari. Server-side sources often lack a real user IP — map it explicitly if so.',
      type: 'string',
      required: true,
      default: { '@path': '$.context.ip' }
    },
    user_agent: {
      label: 'User Agent',
      description: 'Browser user agent string of the end user.',
      type: 'string',
      required: true,
      default: { '@path': '$.context.userAgent' }
    },
    url: {
      label: 'Page URL',
      description:
        'Full URL (`http://` or `https://`) of the page the event occurred on. Include UTM parameters if available.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.context.page.url' },
          then: { '@path': '$.context.page.url' },
          else: { '@path': '$.properties.url' }
        }
      }
    },
    referrer_url: {
      label: 'Referrer URL',
      description: 'URL of the referring page, if any.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.page.referrer' },
          then: { '@path': '$.context.page.referrer' },
          else: { '@path': '$.properties.referrer' }
        }
      }
    },
    email: {
      label: 'Email',
      description:
        'Email address of the user. Normalized (trimmed, lowercased) and hashed with SHA-256, SHA-1 and MD5 before sending. A value that is already a hex digest is passed through unchanged.',
      type: 'string',
      required: false,
      category: 'hashedPII',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    order_id: {
      label: 'Order ID',
      description: 'Order identifier for purchase events. Sent as `args.order_id` (always a string).',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.order_id' }
    },
    order_total: {
      label: 'Order Total',
      description:
        'Order value for purchase events, used for ROAS. Sent as `args.order_total` (a number). Defaults to `properties.total`, falling back to `properties.revenue`.',
      type: 'number',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties.total' },
          then: { '@path': '$.properties.total' },
          else: { '@path': '$.properties.revenue' }
        }
      }
    },
    args: {
      label: 'Additional Properties',
      description:
        'Arbitrary JSON object of event properties, forwarded as `args`. `order_id` and `order_total` above take precedence over keys of the same name here. Avoid sending PII here.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.properties' }
    },
    enable_batching: {
      label: 'Enable Batching',
      description:
        'When enabled, events are sent to the Tatari batch endpoint in groups instead of one request per event.',
      type: 'boolean',
      required: false,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: `Maximum number of events per batch request. Tatari accepts at most ${MAX_BATCH_SIZE}. Actual batch sizes may be smaller.`,
      type: 'number',
      required: false,
      default: MAX_BATCH_SIZE,
      minimum: 1,
      maximum: MAX_BATCH_SIZE,
      unsafe_hidden: true
    }
  },

  perform: (request, { payload, settings }) => {
    const event = buildEvent(payload)
    return request(trackUrl(settings.environment), {
      method: 'post',
      json: event
    })
  },

  performBatch: async (request, { payload: payloads, settings }) => {
    const multiStatus = new MultiStatusResponse()
    const events: TatariWebEvent[] = []
    const indexMap: number[] = []

    payloads.forEach((payload, originalIndex) => {
      try {
        events.push(buildEvent(payload))
        indexMap.push(originalIndex)
      } catch (error) {
        const err = error as IntegrationError
        multiStatus.setErrorResponseAtIndex(originalIndex, {
          status: err.status ?? 400,
          errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
          errormessage: err.message
        })
      }
    })

    if (events.length === 0) {
      return multiStatus
    }

    const response = await request<BatchResponse>(batchUrl(settings.environment), {
      method: 'post',
      json: events,
      // 207/400 carry per-event detail in the body; handled in applyBatchResponse
      throwHttpErrors: false
    })

    return applyBatchResponse(multiStatus, response, events, indexMap)
  }
}

export default action
