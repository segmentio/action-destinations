import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import { v4 as uuidv4 } from '@lukeed/uuid'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const ENDPOINT = 'https://t.vibe.co/s2s-conversion/events/segment'

// Events older than this (relative to now) are rejected by Vibe.
const MAX_EVENT_AGE_MS = 7 * 24 * 60 * 60 * 1000
// Allow a small amount of clock skew for timestamps slightly in the future.
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000

// Standard dotted-quad IPv4 validation (0-255 per octet).
const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion Event',
  description: 'Send a server-to-server conversion event to Vibe.',
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    eventId: {
      label: 'Event ID',
      description:
        'Distinct event identifier (UUID recommended). Defaults to the Segment message ID. A UUID is generated automatically if left empty.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.messageId'
      }
    },
    action: {
      label: 'Action',
      description: 'The conversion action category performed. No default is applied; set explicitly or via a preset.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Call', value: 'call' },
        { label: 'Install', value: 'install' },
        { label: 'Lead', value: 'lead' },
        { label: 'Page View', value: 'page_view' },
        { label: 'Purchase', value: 'purchase' },
        { label: 'Signup', value: 'signup' }
      ]
    },
    timestamp: {
      label: 'Timestamp',
      description:
        'Event timestamp. Converted to UNIX epoch milliseconds before sending. Must be within the last 7 days.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    email: {
      label: 'Email',
      description: "The user's email address. Required if IP Address is not provided.",
      type: 'string',
      format: 'email',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: {
            '@if': {
              exists: { '@path': '$.traits.email' },
              then: { '@path': '$.traits.email' },
              else: { '@path': '$.context.traits.email' }
            }
          }
        }
      }
    },
    ipAddress: {
      label: 'IP Address',
      description: "The user's IP address (IPv4). Required if Email is not provided.",
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.ip'
      }
    },
    eventData: {
      label: 'Event Data',
      description:
        'Additional event data sent as a stringified JSON object. Reserved keys `price_usd` (float) and `purchase_id` (string) can be set here or via their dedicated fields.',
      type: 'object',
      required: false,
      default: {
        '@path': '$.properties'
      }
    },
    priceUsd: {
      label: 'Price (USD)',
      description: 'The purchase price in USD. Merged into the event data payload as `price_usd`.',
      type: 'number',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties.price' },
          then: { '@path': '$.properties.price' },
          else: { '@path': '$.properties.revenue' }
        }
      }
    },
    purchaseId: {
      label: 'Purchase ID',
      description: 'The purchase or order identifier. Merged into the event data payload as `purchase_id`.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties.order_id' },
          then: { '@path': '$.properties.order_id' },
          else: { '@path': '$.properties.purchase_id' }
        }
      }
    },
    googleAnalyticsId: {
      label: 'Google Analytics ID',
      description: 'Google Analytics identifier used for cross-platform attribution.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.gid'
      }
    },
    userAgent: {
      label: 'User Agent',
      description: 'The browser/device user agent string.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.userAgent'
      }
    },
    url: {
      label: 'URL',
      description: 'The URL of the page where the action occurred.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.page.url'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const {
      eventId,
      action: conversionAction,
      timestamp,
      email,
      ipAddress,
      eventData,
      priceUsd,
      purchaseId,
      googleAnalyticsId,
      userAgent,
      url
    } = payload

    // Vibe requires at least one identifier: email or IP address.
    if (!email && !ipAddress) {
      throw new PayloadValidationError('Either Email or IP Address is required.')
    }

    // Validate IPv4 format when an IP is provided.
    if (ipAddress && !IPV4_REGEX.test(ipAddress)) {
      throw new PayloadValidationError(`IP Address "${ipAddress}" is not a valid IPv4 address.`)
    }

    // The `action` enum and `timestamp` date format are validated by the
    // framework against the field definitions before `perform` runs.
    const ts = new Date(timestamp).getTime()
    if (Number.isNaN(ts)) {
      throw new PayloadValidationError('Timestamp could not be parsed into a valid date.')
    }

    // Vibe rejects events older than 7 days (and implausible future timestamps).
    const now = Date.now()
    if (ts < now - MAX_EVENT_AGE_MS) {
      throw new PayloadValidationError('Timestamp is older than 7 days; the event cannot be sent to Vibe.')
    }
    if (ts > now + MAX_FUTURE_SKEW_MS) {
      throw new PayloadValidationError('Timestamp is too far in the future.')
    }

    // `ed` is a stringified JSON object. Start from the arbitrary event data
    // object, then merge the reserved keys `price_usd` and `purchase_id`.
    const data: Record<string, unknown> = { ...(eventData ?? {}) }
    if (priceUsd !== undefined && priceUsd !== null) {
      data.price_usd = priceUsd
    }
    if (purchaseId !== undefined && purchaseId !== null && purchaseId !== '') {
      data.purchase_id = purchaseId
    }
    const ed = Object.keys(data).length > 0 ? JSON.stringify(data) : undefined

    const body = {
      eid: eventId || uuidv4(),
      a: conversionAction,
      aid: settings.pixelId,
      ts,
      em: email,
      ip: ipAddress,
      ed,
      gid: googleAnalyticsId,
      ua: userAgent,
      url
    }

    return request(ENDPOINT, {
      method: 'POST',
      json: body
    })
  }
}

export default action
