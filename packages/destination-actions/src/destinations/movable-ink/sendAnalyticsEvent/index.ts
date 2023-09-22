import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { PayloadValidationError } from '@segment/actions-core/*'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Analytics Event',
  description: 'Send a Segment track() event to Movable Ink',
  fields: {
    userId: {
      label: 'User ID',
      description: 'A known user identifier to send to Movable Ink',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'An anonymous user identifier to send to Movable Ink',
      type: 'string',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    timestamp: {
      label: 'timestamp',
      description: 'Timestamp for the event.',
      type: 'datetime',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    eventName: {
      label: 'Event Name',
      description: 'The name of the event',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    products: {
      label: 'Products',
      description: 'Product details to associate with the event',
      type: 'object',
      required: false,
      multiple: true,
      properties: {
        product_id: {
          label: 'Product ID',
          description: 'Identifier for the product',
          type: 'string',
          required: true
        },
        name: {
          label: 'Product name',
          description: 'Product name',
          type: 'string',
          required: false
        },
        quantity: {
          label: 'Quantity',
          description: 'Quantity of the product',
          type: 'number',
          required: false
        },
        brand: {
          label: 'Brand',
          description: 'Product brand',
          type: 'string',
          required: false
        },
        price: {
          label: 'Product price',
          description: 'Product price',
          type: 'number',
          required: false
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            product_id: { '@path': '$.product_id' },
            name: { '@path': '$.name' },
            quantity: { '@path': '$.quantity' },
            brand: { '@path': '$.brand' },
            price: { '@path': '$.price' }
          }
        ]
      }
    }
  },
  perform: (request, { payload }) => {
    if(!payload.userId && !payload.anonymousId)
      throw new PayloadValidationError("Payload must include User ID or Anonymous ID")

    
    return request('https://eoo9cq5i12kcd1g.m.pipedream.net', {
      method: 'POST',
      json: payload
    })
  }
}

export default action
