import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from "../cordial-client";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Product to Cart',
  description: 'Add product to Cordial contact cart',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    userIdentities: {
      label: 'User Identities',
      description:
        'An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. At least one identifier should be valid otherwise the contact will not be identified and the request will be ignored.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only'
    },
    productID: {
      label: 'Product ID',
      description: 'Internal identifier of a product',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.product_id'
      }
    },
    sku: {
      label: 'SKU',
      description: 'SKU of a product',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.sku'
      }
    },
    qty: {
      label: 'Quantity',
      description: 'Quantity of a product',
      type: 'integer',
      required: true,
      default: {
        '@path': '$.properties.quantity'
      }
    },
    category: {
      label: 'Category',
      description: 'Category of a product',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.category'
      }
    },
    name: {
      label: 'Name',
      description: 'Name of a product',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.name'
      }
    },
    description: {
      label: 'Description',
      description: 'Description of a product',
      type: 'string',
      required: false
    },
    itemPrice: {
      label: 'Price',
      description: 'Price of a product',
      type: 'number',
      required: false,
      default: {
        '@path': '$.properties.price'
      }
    },
    url: {
      label: 'URL',
      description: 'URL of a product',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.url'
      }
    },
    imageUrl: {
      label: 'Image URL',
      description: 'Image of a product',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.image_url'
      }
    },
    properties: {
      label: 'Properties',
      description: 'Properties of a product (e.g brand, color, size)',
      type: 'object',
      required: false,
      default: {
        brand: { '@path': '$.properties.brand' },
        variant: { '@path': '$.properties.variant' },
        coupon: { '@path': '$.properties.coupon' }
      },
      defaultObjectUI: 'keyvalue:only'
    },
  },
  perform: (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.addProductToCart(payload)
  }
}

export default action
