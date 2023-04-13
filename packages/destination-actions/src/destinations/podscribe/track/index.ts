import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { serializeParams } from '../utils'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Send user events to Podscribe',
  defaultSubscription: 'type = "track"',
  fields: {
    userId: {
      type: 'string',
      allowNull: true,
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: false,
      description: 'The timestamp of the event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    },
    referrer: {
      type: 'string',
      allowNull: true,
      description: 'The page referrer',
      label: 'Page Referrer',
      default: {
        '@if': {
          exists: { '@path': '$.context.page.referrer' },
          then: { '@path': '$.context.page.referrer' },
          else: { '@path': '$.properties.referrer' }
        }
      }
    },
    url: {
      type: 'string',
      format: 'uri',
      allowNull: true,
      description: 'The page URL',
      label: 'Page URL',
      default: {
        '@if': {
          exists: { '@path': '$.context.page.url' },
          then: { '@path': '$.context.page.url' },
          else: { '@path': '$.properties.url' }
        }
      }
    },
    ip: {
      label: 'Ip',
      type: 'string',
      description: 'The IP address of the device sending the event.',
      default: {
        '@path': '$.context.ip'
      }
    },
    userAgent: {
      label: 'User Agent',
      type: 'string',
      description: 'The user agent of the device sending the event.',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    event: {
      type: 'string',
      required: true,
      description: 'The event name',
      label: 'Event Name',
      default: { '@path': '$.event' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Properties to send with the event',
      label: 'Event properties',
      default: { '@path': '$.properties' }
    },
    event_type: {
      type: 'string',
      required: true,
      description: 'Type of event to send',
      label: 'Event type',
      default: { '@path': '$.event_type' }
    }
  },
  perform: (request, { settings, payload }) => {
    const params = serializeParams({
      action: payload.event_type,
      advertiser: settings.advertiser,
      timestamp: payload.timestamp,
      device_id: payload.userId,
      referrer: payload.referrer,
      url: payload.url,
      ip: payload.ip,
      user_agent: payload.userAgent,
      order_value: payload.properties?.total,
      order_number: payload.properties?.order_id,
      currency: payload.properties?.currency,
      discount_code: payload.properties?.coupon,
      hashed_email: payload.properties?.email,
      num_items_purchased: payload.properties?.num_items_purchased,
      is_new_customer: payload.properties?.is_new_customer,
      is_subscription: payload.properties?.is_subscription
    })

    return request(`https://verifi.podscribe.com/tag?${params}`)
  }
}

export default action
