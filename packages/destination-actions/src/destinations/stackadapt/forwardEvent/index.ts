import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward Event',
  description: 'Forward Segment events to StackAdapt for conversion tracking',
  defaultSubscription: 'type = "identify" or type = "page" or type = "screen" or type = "track"',
  fields: {
    eventType: {
      label: 'Event Type',
      description: 'The Segment event type (page, track, etc.)',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    },
    ip: {
      description: 'IP address of the user',
      label: 'IP Address',
      required: false,
      type: 'string',
      default: {
        '@path': '$.context.ip'
      }
    },
    userAgent: {
      description: 'User-Agent of the user',
      label: 'User Agent',
      required: false,
      type: 'string',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    eventProperties: {
      label: 'Event Properties',
      description: 'Additional properties associated with the event.',
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    title: {
      type: 'string',
      required: false,
      description: 'The title of the page where the event occurred.',
      label: 'Page Title',
      default: { '@path': '$.context.page.title' }
    },
    url: {
      type: 'string',
      required: false,
      description: 'The URL of the page where the event occurred.',
      label: 'URL',
      default: { '@path': '$.context.page.url' }
    },
    referrer: {
      type: 'string',
      required: false,
      description: 'The referrer of the page where the event occurred.',
      label: 'Referrer',
      default: { '@path': '$.context.page.referrer' }
    },
    utmSource: {
      type: 'string',
      format: 'text',
      label: 'UTM Source',
      description: 'UTM source parameter associated with even',
      required: false,
      default: { '@path': '$.context.campaign.source' }
    },
    email: {
      label: 'Email',
      description: 'Email address of the individual who triggered the conversion event.',
      type: 'string',
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    phone: {
      label: 'Phone Number',
      description:
        'Phone number of the individual who triggered the conversion event, in E.164 standard format, e.g. +14150000000.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.phone' },
          then: { '@path': '$.properties.phone' },
          else: { '@path': '$.traits.phone' }
        }
      }
    },
    firstName: {
      label: 'First Name',
      description: 'First name of the individual who triggered the conversion event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.firstName' },
          then: { '@path': '$.properties.firstName' },
          else: { '@path': '$.traits.firstName' }
        }
      }
    },
    lastName: {
      label: 'Last Name',
      description: 'Last name of the individual who triggered the conversion event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.lastName' },
          then: { '@path': '$.properties.lastName' },
          else: { '@path': '$.traits.lastName' }
        }
      }
    },
    revenue: {
      label: 'Revenue',
      type: 'number',
      description: 'The revenue generated from the event.',
      required: false,
      default: {
        '@path': '$.properties.revenue'
      }
    },
    orderId: {
      label: 'Order ID',
      type: 'string',
      description: 'The ID of the order.',
      required: false,
      default: {
        '@path': '$.properties.orderId'
      }
    },
    products: {
      label: 'Products',
      description: 'The list of products purchased.',
      type: 'object',
      multiple: true,
      additionalProperties: true,
      properties: {
        price: {
          label: 'Price',
          type: 'number',
          description: 'The price of the item purchased.'
        },
        quantity: {
          label: 'Quantity',
          type: 'integer',
          description: 'The quantity of the item purchased.'
        },
        productId: {
          label: 'Product ID',
          type: 'string',
          description: 'An identifier for the item purchased.'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            price: {
              '@path': 'price'
            },
            quantity: {
              '@path': 'quantity'
            },
            productId: {
              '@path': 'product_id'
            }
          }
        ]
      }
    },
    userId: {
      label: 'Segment User ID',
      description: 'The ID of the user in Segment',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    const queryStr = new URLSearchParams(getAvailableData(payload, settings)).toString()
    return request(`https://tags.srv.stackadapt.com/saq_pxl?${queryStr}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': payload.ip ?? '',
        'User-Agent': payload.userAgent ?? ''
      }
    })
  }
}

function getAvailableData(payload: Payload, settings: Settings) {
  const data = {
    segment_ss: '1',
    event_type: payload.eventType ?? '',
    title: payload.title ?? '',
    url: payload.url ?? '',
    ref: payload.referrer ?? '',
    ip_fwd: payload.ip ?? '',
    utm_source: payload.utmSource ?? '',
    /**
     * By default we want to use the permanent user id that's consistent across a customer's lifetime.
     * But if we don't have that we can fall back to the anonymous id
     *
     * See: https://segment.com/docs/connections/spec/identify/#user-id
     */
    first_name: payload.firstName ?? '',
    last_name: payload.lastName ?? '',
    email: payload.email ?? '',
    phone: payload.phone ?? '',
    user_id: payload.userId,
    uid: settings.pixelId,
    args: getProductJson(payload)
  }
  const { args, ...dataMinusProducts } = data
  return data.args === '{}' ? dataMinusProducts : data
}

function getProductJson(payload: Payload) {
  const productData = {
    revenue: payload.revenue ?? undefined,
    order_id: payload.orderId ?? undefined,
    products: payload.products
      ? payload.products.map((product) => {
          return {
            product_id: product.productId,
            product_price: product.price,
            product_quantity: product.quantity
          }
        })
      : undefined
  }
  return JSON.stringify(productData)
}

export default action
