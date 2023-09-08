import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: '',
  fields: {
    id: {
      label: 'User ID',
      description: 'User ID to uniquely identify a customer in Optimizely',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'Anonymous ID if no user Id exist',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    event: {
      label: 'Event Type',
      description: 'The type of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    event_id: {
      label: 'Event ID',
      description: 'Event ID to maintain unique event data',
      type: 'string',
      default: {
        '@path': '$.messageId'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Event timestamp',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    props: {
      label: 'Event Properties',
      description: 'Event data to be used',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    products: {
      label: 'Products',
      description: 'Product details of the event.',
      type: 'object',
      multiple: true,
      additionalProperties: true,
      properties: {
        product_id: {
          label: 'Product ID',
          type: 'string',
          description: 'Product ID'
        },
        name: {
          label: 'Name',
          type: 'string',
          description: 'Name'
        }
        /* taxonomy: {
          label: 'Taxonomy',
          type: 'string',
          description: 'Category'
        },
        unit_sale_price: {
          label: 'Unit Sale Price',
          type: 'number',
          description: 'Unit price of the product. Required field for Purchase and Cart Page Events.'
        },
        unit_price: {
          label: 'Unit Price',
          type: 'number',
          description: 'Price'
        },
        quantity: {
          label: 'Quantity',
          type: 'integer',
          description: 'Quantity'
        },
        url: {
          label: 'Product Url',
          type: 'string',
          description: 'Product Url'
        },
        product_image_url: {
          label: 'Product Image Url',
          type: 'string',
          description: 'Product Image Url'
        } */
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            product_id: { '@path': 'product_id' },
            //taxonomy: { '@path': 'category' },
            name: { '@path': 'name' },
            //variant_id: { '@path': 'variant' },
            //unit_sale_price: { '@path': 'price' },
            //unit_price: { '@path': 'price' },
            //quantity: { '@path': 'quantity' },
            //url: { '@path': 'url' },
            //product_image_url: { '@path': 'image_url' }
          }
        ]
      }
    }
  },
  perform: (request, data) => {
    // data.payload.event.toString().toLowerCase().trim().split(' ').join('_').toString()
    console.log('payload => ', data.payload);
    return request('https://example.com', {
      method: 'post',
      json: data.payload
    });
  }
}

export default action
