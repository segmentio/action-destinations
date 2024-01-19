import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward Event',
  description: 'Forward Segment events to StackAdapt for conversion tracking',
  defaultSubscription: 'type = "identify" or type = "page" or type = "screen" or type = "track"',
  fields: {
    user_id: {
      label: 'Segment User ID',
      description: 'The ID of the user in Segment',
      type: 'string',
      required: true,
      default: {
        // By default we want to use the permanent user id that's consistent across a customer's lifetime.
        // But if we don't have that we can fall back to the anonymous id
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    event_type: {
      label: 'Event Type',
      description: 'The Segment event type (page, track, etc.)',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    },
    ip_fwd: {
      description: 'IP address of the user',
      label: 'IP Address',
      type: 'string',
      default: {
        '@path': '$.context.ip'
      }
    },
    title: {
      type: 'string',
      description: 'The title of the page where the event occurred.',
      label: 'Page Title',
      default: { '@path': '$.context.page.title' }
    },
    url: {
      type: 'string',
      description: 'The URL of the page where the event occurred.',
      label: 'URL',
      default: { '@path': '$.context.page.url' }
    },
    referrer: {
      type: 'string',
      description: 'The referrer of the page where the event occurred.',
      label: 'Referrer',
      default: { '@path': '$.context.page.referrer' }
    },
    utm_source: {
      type: 'string',
      format: 'text',
      label: 'UTM Source',
      description: 'UTM source parameter associated with event',
      default: { '@path': '$.context.campaign.source' }
    },
    user_agent: {
      description: 'User-Agent of the user',
      label: 'User Agent',
      type: 'string',
      default: {
        '@path': '$.context.userAgent'
      }
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
    first_name: {
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
    last_name: {
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
    ecommerce_data: {
      label: 'Pixel Request Params',
      description: 'Additional ecommerce fields that are included in the pixel payload.',
      type: 'object',
      additionalProperties: true,
      properties: {
        action: {
          label: 'Event Name',
          description: 'The event name (e.g. Order Completed)',
          type: 'string',
          default: {
            '@path': '$.event'
          }
        },
        revenue: {
          label: 'Revenue',
          type: 'number',
          description: 'The revenue generated from the event.',
          default: {
            '@path': '$.properties.revenue'
          }
        },
        order_id: {
          label: 'Order ID',
          type: 'string',
          description: 'The ID of the order.',
          default: {
            '@path': '$.properties.order_id'
          }
        },
        product_price: {
          label: 'Price',
          type: 'number',
          description: 'The price of the product.',
          default: {
            '@path': '$.properties.price'
          }
        },
        product_quantity: {
          label: 'Quantity',
          type: 'integer',
          description: 'The quantity of the product.',
          default: {
            '@path': '$.properties.quantity'
          }
        },
        product_id: {
          label: 'Product ID',
          type: 'string',
          description: 'An identifier for the product.',
          default: {
            '@path': '$.properties.product_id'
          }
        },
        product_category: {
          label: 'Product Category',
          type: 'string',
          description: 'A category for the product.',
          default: {
            '@path': '$.properties.category'
          }
        },
        product_name: {
          label: 'Product Name',
          type: 'string',
          description: 'The name of the product.',
          default: {
            '@path': '$.properties.name'
          }
        },
        products: {
          label: 'Products',
          description:
            'The list of products associated with the event (for events with multiple products, such as order completed)',
          type: 'object',
          multiple: true,
          additionalProperties: true,
          properties: {
            product_price: {
              label: 'Price',
              type: 'number',
              description: 'The price of the product.'
            },
            product_quantity: {
              label: 'Quantity',
              type: 'integer',
              description: 'The quantity of the product.'
            },
            product_id: {
              label: 'Product ID',
              type: 'string',
              description: 'An identifier for the product.'
            },
            product_category: {
              label: 'Product Category',
              type: 'string',
              description: 'A category for the product.'
            },
            product_name: {
              label: 'Product Name',
              type: 'string',
              description: 'The name of the product.'
            }
          }
        }
      },
      default: {
        action: { '@path': '$.event' },
        revenue: { '@path': '$.properties.revenue' },
        order_id: { '@path': '$.properties.order_id' },
        product_price: { '@path': '$.properties.price' },
        product_quantity: { '@path': '$.properties.quantity' },
        product_id: { '@path': '$.properties.product_id' },
        product_category: { '@path': '$.properties.category' },
        product_name: { '@path': '$.properties.name' },
        products: {
          '@arrayPath': [
            '$.properties.products',
            {
              product_price: {
                '@path': 'price'
              },
              product_quantity: {
                '@path': 'quantity'
              },
              product_id: {
                '@path': 'product_id'
              },
              product_category: {
                '@path': 'category'
              },
              product_name: {
                '@path': 'name'
              }
            }
          ]
        }
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    // Don't include ecommerce data if it's empty or if it only contains the action field
    if (payload.ecommerce_data) {
      Object.keys(payload.ecommerce_data).forEach((key) => {
        if (typeof payload.ecommerce_data?.[key] === 'object' && isEmpty(payload.ecommerce_data?.[key])) {
          delete payload.ecommerce_data?.[key]
        }
      })
      if (isEmpty(payload.ecommerce_data) || isEqual(Object.keys(payload.ecommerce_data), ['action']))
        delete payload.ecommerce_data
    }

    return request(`https://tags.srv.stackadapt.com/saq_pxl`, {
      method: 'GET',
      searchParams: getAvailableData(payload, settings),
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': payload.ip_fwd ?? '',
        'User-Agent': payload.user_agent ?? ''
      }
    })
  }
}

function getAvailableData(payload: Payload, settings: Settings) {
  const data: Record<string, string> = {
    segment_ss: '1',
    event_type: payload.event_type ?? '',
    title: payload.title ?? '',
    url: payload.url ?? '',
    ref: payload.referrer ?? '',
    ip_fwd: payload.ip_fwd ?? '',
    utm_source: payload.utm_source ?? '',
    first_name: payload.first_name ?? '',
    last_name: payload.last_name ?? '',
    email: payload.email ?? '',
    phone: payload.phone ?? '',
    user_id: payload.user_id,
    uid: settings.pixelId,
    args: JSON.stringify(payload.ecommerce_data)
  }
  if (!data.args) delete data.args
  return data
}

export default action
