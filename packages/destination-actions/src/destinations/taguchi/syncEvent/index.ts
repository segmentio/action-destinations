import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Event',
  description: 'Sync ecommerce events to Taguchi.',
  fields: {
    target: {
      label: 'Event Target',
      description: 'Target identifier for the event. At least one identifier is required.',
      type: 'object',
      required: true,
      properties: {
        ref: {
          label: 'Reference',
          description: 'A unique identifier for the target.',
          type: 'string'
        },
        email: {
          label: 'Email',
          description: 'Email address of the target.',
          type: 'string',
          format: 'email'
        },
        phone: {
          label: 'Phone',
          description: 'Phone number of the target.',
          type: 'string'
        },
        id: {
          label: 'ID',
          description: 'Numeric ID of the target.',
          type: 'integer'
        }
      },
      default: {
        ref: { '@path': '$.userId' },
        email: { '@path': '$.properties.email' }
      }
    },
    isTest: {
      label: 'Is Test Event',
      description: 'Whether this is a test event.',
      type: 'boolean',
      required: false,
      default: false
    },
    eventType: {
      label: 'Event Type',
      description: 'Type of event being sent.',
      type: 'string',
      required: true,
      default: 'p'
    },
    eventData: {
      label: 'Event Data',
      description: 'Ecommerce event data including total and products.',
      type: 'object',
      required: false,
      properties: {
        total: {
          label: 'Total',
          description: 'Total value of the transaction.',
          type: 'number',
          required: false
        },
        products: {
          label: 'Products',
          description: 'Array of products in the transaction.',
          type: 'object',
          multiple: true,
          required: false,
          properties: {
            sku: {
              label: 'SKU',
              description: 'Product SKU.',
              type: 'string',
              required: false
            },
            price: {
              label: 'Price',
              description: 'Product price.',
              type: 'number',
              required: false
            },
            quantity: {
              label: 'Quantity',
              description: 'Product quantity.',
              type: 'integer',
              required: false
            },
            name: {
              label: 'Product Name',
              description: 'Product name.',
              type: 'string',
              required: false
            },
            category: {
              label: 'Category',
              description: 'Product category.',
              type: 'string',
              required: false
            }
          }
        },
        currency: {
          label: 'Currency',
          description: 'Currency code for the transaction.',
          type: 'string',
          required: false
        },
        order_id: {
          label: 'Order ID',
          description: 'Unique identifier for the order.',
          type: 'string',
          required: false
        }
      },
      additionalProperties: false,
      default: {
        total: { '@path': '$.properties.total' },
        products: { '@path': '$.properties.products' },
        currency: { '@path': '$.properties.currency' },
        order_id: { '@path': '$.properties.order_id' }
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    await send(request, [payload], settings, false)
  },
  performBatch: async (request, { payload, settings }) => {
    await send(request, payload, settings, true)
  }
}

export default action
