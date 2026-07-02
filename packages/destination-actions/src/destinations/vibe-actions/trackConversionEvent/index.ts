import type { ActionDefinition } from '@segment/actions-core'
import { v4 as uuidv4 } from '@lukeed/uuid'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const ENDPOINT = 'https://t.vibe.co/s2s-conversion/events'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion Event',
  description: 'Send a server-to-server conversion event to Vibe.',
  defaultSubscription: 'type = "track"',
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
      description: 'The conversion action category performed.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Install', value: 'install' },
        { label: 'Lead', value: 'lead' },
        { label: 'Page View', value: 'page_view' },
        { label: 'Purchase', value: 'purchase' },
        { label: 'Signup', value: 'signup' }
      ],
      default: {
        '@path': '$.event'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Event timestamp. Converted to UNIX epoch milliseconds before sending.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    ipAddress: {
      label: 'IP Address',
      description: "The user's IP address.",
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.ip'
      }
    },
    priceUsd: {
      label: 'Price (USD)',
      description: 'The purchase price in USD. Included in the event data payload.',
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
      description: 'The purchase or order identifier. Included in the event data payload.',
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
      description: 'Google Analytics identifier used for attribution.',
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
      ipAddress,
      priceUsd,
      purchaseId,
      googleAnalyticsId,
      userAgent,
      url
    } = payload

    // The `action` enum and `timestamp` date format are validated by the
    // framework against the field definitions before `perform` runs.
    const ts = new Date(timestamp).getTime()

    // `ed` is a JSON string with recognized keys `price_usd` (float) and
    // `purchase_id` (string). Only include it when at least one key is present.
    let ed: string | undefined
    const eventData: { price_usd?: number; purchase_id?: string } = {}
    if (priceUsd !== undefined && priceUsd !== null) {
      eventData.price_usd = priceUsd
    }
    if (purchaseId !== undefined && purchaseId !== null && purchaseId !== '') {
      eventData.purchase_id = purchaseId
    }
    if (Object.keys(eventData).length > 0) {
      ed = JSON.stringify(eventData)
    }

    const body = {
      eid: eventId || uuidv4(),
      a: conversionAction,
      aid: settings.pixelId,
      ts,
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
