import { ActionDefinition} from '@segment/actions-core'
import { eventSchema } from '../event-schema'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userAgentData } from '../properties'
import { autocaptureFields } from '../autocapture-fields'
import { send } from '../events-functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Event V2',
  description: 'Send an event to Amplitude',
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
    setOnce: {
      label: 'Set Once',
      description: "The following fields will only be set as user properties if they do not already have a value. If 'Autocapture Attribution' is enabled, UTM and attribution values in this field will be ignored.",
      type: 'object',
      additionalProperties: true,
      properties: {
        initial_referrer: {
          label: 'Initial Referrer',
          type: 'string',
          description: 'The referrer of the web request.'
        },
        initial_utm_source: {
          label: 'Initial UTM Source',
          type: 'string'
        },
        initial_utm_medium: {
          label: 'Initial UTM Medium',
          type: 'string'
        },
        initial_utm_campaign: {
          label: 'Initial UTM Campaign',
          type: 'string'
        },
        initial_utm_term: {
          label: 'Initial UTM Term',
          type: 'string'
        },
        initial_utm_content: {
          label: 'Initial UTM Content',
          type: 'string'
        }
      },
      default: {
        initial_referrer: { '@path': '$.context.page.referrer' },
        initial_utm_source: { '@path': '$.context.campaign.source' },
        initial_utm_medium: { '@path': '$.context.campaign.medium' },
        initial_utm_campaign: { '@path': '$.context.campaign.name' },
        initial_utm_term: { '@path': '$.context.campaign.term' },
        initial_utm_content: { '@path': '$.context.campaign.content' }
      }
    },
    setAlways: {
      label: 'Set Always',
      description: "The following fields will be set as user properties for every event. If 'Autocapture Attribution' is enabled, UTM and attribution values in this field will be ignored.",
      type: 'object',
      additionalProperties: true,
      properties: {
        referrer: {
          label: 'Referrer',
          type: 'string'
        },
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
        referrer: { '@path': '$.context.page.referrer' },
        utm_source: { '@path': '$.context.campaign.source' },
        utm_medium: { '@path': '$.context.campaign.medium' },
        utm_campaign: { '@path': '$.context.campaign.name' },
        utm_term: { '@path': '$.context.campaign.term' },
        utm_content: { '@path': '$.context.campaign.content' }
      }
    },
    add: {
      label: 'Add',
      description:
        "Increment a user property by a number with add. If the user property doesn't have a value set yet, it's initialized to 0.",
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue'
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
        'Enabling this setting will set the Device manufacturer, Device Model and OS Name properties based on the user agent string provided in the userAgent field.',
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
        'Amplitude has a default minimum id length of 5 characters for user_id and device_id fields. This field allows the minimum to be overridden to allow shorter id lengths.',
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
