import { eventSchema } from '../event-schema'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userAgentData } from '../properties'
import { autocaptureFields } from '../autocapture-fields'
import { send } from '../events-functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Event',
  description: 'Send an event to Amplitude.',
  defaultSubscription: 'type = "track"',
  fields: {
    ...eventSchema,
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
    ...autocaptureFields,
    utm_properties: {
      label: 'UTM Properties',
      type: 'object',
      description: 'UTM Tracking Properties',
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
    },
    use_batch_endpoint: {
      label: 'Use Batch Endpoint',
      description:
        "If true, events are sent to Amplitude's `batch` endpoint rather than their `httpapi` events endpoint. Enabling this setting may help reduce 429s – or throttling errors – from Amplitude. More information about Amplitude's throttling is available in [their docs](https://developers.amplitude.com/docs/batch-event-upload-api#429s-in-depth).",
      type: 'boolean',
      default: false
    },
    userAgent: {
      label: 'User Agent',
      type: 'string',
      description: 'The user agent of the device sending the event.',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    userAgentParsing: {
      label: 'User Agent Parsing',
      type: 'boolean',
      description:
        'Enabling this setting will set the Device manufacturer, Device Model and OS Name properties based on the user agent string provided in the userAgent field',
      default: true
    },
    includeRawUserAgent: {
      label: 'Include Raw User Agent',
      type: 'boolean',
      description:
        'Enabling this setting will send user_agent based on the raw user agent string provided in the userAgent field',
      default: false
    },
    min_id_length: {
      label: 'Minimum ID Length',
      description:
        'Amplitude has a default minimum id lenght of 5 characters for user_id and device_id fields. This field allows the minimum to be overridden to allow shorter id lengths.',
      allowNull: true,
      type: 'integer'
    },
    userAgentData
  },
  perform: (request, { payload, settings }) => {
    return send(request, payload, settings, false)
  }
}

export default action
