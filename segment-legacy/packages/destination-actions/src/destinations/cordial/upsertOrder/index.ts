import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from "../cordial-client";
import userIdentityFields from "../identities-fields";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Order',
  description: 'Upserts order to Cordial',
  defaultSubscription: 'event = "Order Completed" or event = "Order Updated" or event = "Order Refunded" or event = "Order Cancelled"',
  fields: {
    ...userIdentityFields,
    orderID: {
      label: 'Order ID',
      description: 'Internal identifier of an order',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.order_id'
      }
    },
    purchaseDate: {
      label: 'Order purchase date',
      description: 'Order purchase date',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    status: {
      label: 'Order status',
      description: 'Order status (e.g. completed/cancelled/returned)',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    totalAmount: {
      label: 'Order total',
      description: 'Order total amount',
      type: 'number',
      required: true,
      default: {
        '@path': '$.properties.total'
      }
    },
    properties: {
      label: 'Order properties',
      description: 'Additional order properties (e.g. affiliation/tax/revenue)',
      type: 'object',
      required: false,
      default: {
        affiliation: { '@path': '$.properties.affiliation' },
        revenue: { '@path': '$.properties.revenue' },
        shipping: { '@path': '$.properties.shipping' },
        tax: { '@path': '$.properties.tax' },
        discount: { '@path': '$.properties.discount' },
        coupon: { '@path': '$.properties.coupon' },
        currency: { '@path': '$.properties.currency' }
      },
      defaultObjectUI: 'keyvalue:only'
    },
    items: {
      label: 'Order items',
      description: 'Order items',
      type: 'object',
      required: true,
      multiple: true,
      properties: {
        productID: {
          label: 'ID',
          description: 'ID of the purchased item.',
          type: 'string',
          required: true
        },
        sku: {
          label: 'SKU',
          description: 'SKU of the purchased item.',
          type: 'string',
          required: true
        },
        category: {
          label: 'Category',
          description: 'Category of the purchased item.',
          type: 'string'
        },
        name: {
          label: 'Name',
          description: 'Name of the purchased item.',
          type: 'string',
          required: true
        },
        manufacturerName: {
          label: 'Manufacturer name',
          description: 'Manufacturer name of the purchased item.',
          type: 'string',
        },
        itemPrice: {
          label: 'Price',
          description: 'Price of the purchased item.',
          type: 'number',
        },
        qty: {
          label: 'Quantity',
          description: 'Quantity of the purchased item.',
          type: 'integer',
        },
        url: {
          label: 'URL',
          description: 'URL of the purchased item.',
          type: 'string',
        },
        imageUrl: {
          label: 'Image URL',
          description: 'Image URL of the purchased item.',
          type: 'string',
        },
        properties: {
          label: 'Properties',
          description: 'Additional properties of the purchased item.',
          type: 'object',
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            productID: {
              '@path': '$.product_id'
            },
            sku: {
              '@path': '$.sku'
            },
            category: {
              '@path': '$.category'
            },
            name: {
              '@path': '$.name'
            },
            manufacturerNname: {
              '@path': '$.brand'
            },
            itemPrice: {
              '@path': '$.price'
            },
            qty: {
              '@path': '$.quantity'
            },
            url: {
              '@path': '$.url'
            },
            imageUrl: {
              '@path': '$.image_url'
            },
            properties: {
              variant: { '@path': '$.variant' },
              coupon: { '@path': '$.coupon' }
            },
          }
        ]
      },
      defaultObjectUI: 'keyvalue:only'
    },
  },
  perform: (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.upsertOrder(payload)
  }
}

export default action
