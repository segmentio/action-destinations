import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Order Completion Event',
  description: 'Send order completion event',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    user_id: {
      label: 'User ID',
      description: 'NetElixer User ID',
      type: 'string',
      required: true,
      default: {
        '@template': '{{userId}}'
      }
    },
    total: {
      label: 'Total',
      description: 'Total value of the order',
      type: 'number',
      required: true,
      default: {
        '@template': '{{properties.revenue}}'
      }
    },
    products: {
      label: 'Products',
      description: 'List of product details in the order',
      type: 'object',
      required: false,
      default: {
        '@template': '{{properties.products}}'
      }
    },
    currency: {
      label: 'Currency',
      description: 'Currency of the order (e.g. USD)',
      type: 'string',
      required: false,
      default: {
        '@template': '{{properties.currency}}'
      }
    },
    shipping: {
      label: 'Shipping',
      description: 'Total cost of shipping',
      type: 'number',
      required: false,
      default: {
        '@template': '{{properties.shipping}}'
      }
    },
    order_id: {
      label: 'Order ID',
      description: 'Unique ID of the order',
      type: 'string',
      required: true,
      default: {
        '@template': '{{properties.order_id}}'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'Identifier for anonymous user',
      type: 'string',
      required: false,
      default: {
        '@template': '{{anonymousId}}'
      }
    },
    email: {
      label: 'Email address',
      description: 'The user&#39;s email address',
      type: 'string',
      required: true,
      default: {
        '@if': {
          else: { '@path': '$.properties.email' },
          then: { '@path': '$.context.traits.email' },
          blank: { '@path': '$.context.traits.email' }
        }
      }
    }
  },
  perform: (request, { payload }) => {
    return request('https://www.netelixer.com/domain/api/orders', {
      method: 'POST',
      json: payload
    })
  }
}

export default action
