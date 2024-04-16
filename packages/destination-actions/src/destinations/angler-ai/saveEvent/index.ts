import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseURL, eventsEndpoint } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Event',
  description: 'Send an event to Angler.',
  defaultSubscription: 'type = "track"',
  fields: {
    event_id: {
      label: 'Event ID',
      type: 'string',
      description: 'A unique event identifier.',
      default: {
        '@path': '$.messageId'
      }
    },
    event_name: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of your event',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    custom_event_name: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of your event',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    products: {
      label: 'Products',
      description: 'The list of products purchased.',
      type: 'object',
      multiple: true,
      additionalProperties: false,
      properties: {
        price: {
          label: 'Price',
          type: 'number',
          description:
            'The price of the item purchased. Required for revenue data if the revenue field is not sent. You can use negative values to indicate refunds.'
        },
        quantity: {
          label: 'Quantity',
          type: 'integer',
          description: 'The quantity of the item purchased. Defaults to 1 if not specified.'
        },
        revenue: {
          label: 'Revenue',
          type: 'number',
          description:
            'Revenue = price * quantity. If you send all 3 fields of price, quantity, and revenue, then (price * quantity) will be used as the revenue value. You can use negative values to indicate refunds.'
        },
        productId: {
          label: 'Product ID',
          type: 'string',
          description:
            'An identifier for the item purchased. You must send a price and quantity or revenue with this field.'
        },
        revenueType: {
          label: 'Revenue Type',
          type: 'string',
          description:
            'The type of revenue for the item purchased. You must send a price and quantity or revenue with this field.'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            price: {
              '@path': 'price'
            },
            revenue: {
              '@path': 'revenue'
            },
            quantity: {
              '@path': 'quantity'
            },
            productId: {
              '@path': 'productId'
            },
            revenueType: {
              '@path': 'revenueType'
            }
          }
        ]
      }
    },
    ip: {
      label: 'IP Address',
      type: 'string',
      description:
        'The IP address of the user. Use "$remote" to use the IP address on the upload request. Amplitude will use the IP address to reverse lookup a user\'s location (city, country, region, and DMA). Amplitude has the ability to drop the location and IP address from events once it reaches our servers. You can submit a request to Amplitude\'s platform specialist team here to configure this for you.',
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
    utm_properties: {
      label: 'UTM Properties',
      type: 'object',
      description: 'UTM Tracking Properties',
      additionalProperties: false,
      properties: {
        utm_source: {
          label: 'UTM Source',
          type: 'string'
        },
        utm_medium: {
          label: 'UTM Medium',
          type: 'string'
        },
        utm_campaign: {
          label: 'UTM Campaign',
          type: 'string'
        },
        utm_term: {
          label: 'UTM Term',
          type: 'string'
        },
        utm_content: {
          label: 'UTM Content',
          type: 'string'
        }
      },
      default: {
        utm_source: { '@path': '$.context.campaign.source' },
        utm_medium: { '@path': '$.context.campaign.medium' },
        utm_campaign: { '@path': '$.context.campaign.name' },
        utm_term: { '@path': '$.context.campaign.term' },
        utm_content: { '@path': '$.context.campaign.content' }
      }
    },
    referrer: {
      label: 'Referrer',
      type: 'string',
      description:
        'The referrer of the web request. Sent to Amplitude as both last touch “referrer” and first touch “initial_referrer”',
      default: {
        '@path': '$.context.page.referrer'
      }
    }
  },
  perform: (request, data) => {
    const payload = {
      src: 'SEGMENT',
      data: [data.payload]
    }
    return request(baseURL + eventsEndpoint(data.settings.workspaceId), {
      method: 'post',
      json: payload
    })
  }
}

export default action
