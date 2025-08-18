import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { normalizeEmail, serializeParams } from '../utils'
import type { Payload } from './generated-types'

import { processHashing } from '../../../lib/hashing-utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Send user events to Podscribe',
  defaultSubscription: 'type = "track"',
  fields: {
    anonymousId: {
      type: 'string',
      allowNull: true,
      description: 'The anonymous ID associated with the user',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: true,
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
      label: 'User IP address',
      type: 'string',
      required: true,
      description: 'The IP address of the device sending the event.',
      default: {
        '@path': '$.context.ip'
      }
    },
    library: {
      label: 'Segment Library',
      type: 'object',
      description: 'The library sending the event.',
      default: {
        '@path': '$.context.library'
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
    email: {
      type: 'string',
      allowNull: true,
      description: 'Email address of the user',
      label: 'Email address',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    properties: {
      label: 'Event properties',
      description: 'Properties to send with the event',
      type: 'object',
      additionalProperties: true,
      properties: {
        total: {
          label: 'Total Value',
          type: 'number',
          description: 'The total value of the order'
        },
        order_id: {
          label: 'Order id',
          type: 'string',
          description: 'The order ID. A unique identifier for the order'
        },
        currency: {
          label: 'Currency',
          type: 'string',
          description: 'Currency code. e.g. USD for US dollar, EUR for Euro'
        },
        coupon: {
          label: 'Coupon',
          type: 'string',
          description: 'Coupon Code. A Discount code for the purchase'
        },
        num_items_purchased: {
          label: 'Number of Items Purchased',
          type: 'integer',
          description: 'The number of items purchased in this order'
        },
        is_new_customer: {
          label: 'Is New Customer',
          type: 'boolean',
          description: 'true value indicates if the user is a new customer'
        },
        is_subscription: {
          label: 'Is Subscription',
          type: 'boolean',
          description: 'true value indicates a subscription'
        }
      },
      default: {
        total: { '@path': '$.properties.total' },
        order_id: { '@path': '$.properties.order_id' },
        currency: { '@path': '$.properties.currency' },
        coupon: { '@path': '$.properties.coupon' },
        num_items_purchased: { '@path': '$.properties.num_items_purchased' },
        is_new_customer: { '@path': '$.properties.is_new_customer' },
        is_subscription: { '@path': '$.properties.is_subscription' }
      }
    },
    podscribeEvent: {
      type: 'string',
      required: true,
      description: 'Podscribe type of event to send',
      label: 'Podscribe event type',
      default: { '@path': '$.properties.podscribeEvent' }
    }
  },
  perform: (request, { settings, payload }) => {
    if (payload.email) {
      payload.email = processHashing(payload.email, 'sha256', 'hex', normalizeEmail)
    }

    const { total, order_id, currency, coupon, num_items_purchased, is_new_customer, is_subscription, ...properties } =
      payload.properties || {}

    const params = serializeParams({
      action: payload.podscribeEvent,
      advertiser: settings.advertiser,
      user_id: settings.userId,
      timestamp: payload.timestamp,
      device_id: payload.anonymousId,
      referrer: payload.referrer,
      url: payload.url,
      ip: payload.ip,
      user_agent: payload.userAgent,
      order_value: total,
      order_number: order_id,
      currency: currency,
      discount_code: coupon,
      hashed_email: payload?.email,
      num_items_purchased: num_items_purchased,
      is_new_customer: is_new_customer,
      is_subscription: is_subscription,
      library: payload?.library ? JSON.stringify(payload.library) : undefined,
      properties: Object.keys(properties).length > 0 ? JSON.stringify(properties) : undefined
    })

    return request(`https://verifi.podscribe.com/tag?${params}`)
  }
}

export default action
