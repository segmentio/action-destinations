import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { currencies } from './functions'
import { 
  name,
  external_id,
  user_alias,
  _update_existing_only,
  email,
  phone,
  braze_id,
  cancel_reason,
  time,
  checkout_id,
  order_id,
  cart_id,
  total_value,
  total_discounts,
  discounts,
  currency,
  source,
  checkout_url,
  products,
  metadata,
  enable_batching,
  batch_size
} from './fields'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Ecommerce Event',
  description: 'Send an ecommerce event to Braze',
  fields: {
    cancel_reason: {
      label: 'Cancel Reason',
      description: 'Reason why the order was cancelled.',
      type: 'string',
      default: {
        '@path': '$.properties.reason'
      }
    },
    external_id: {
      label: 'External User ID',
      description: 'The unique user identifier',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    name: {
      label: 'Ecommerce Event Name',
      description: 'The name of the Braze ecommerce recommended event',
      type: 'string',
      required: true,
      choices: [
        { label: 'Product Viewed', value: 'ecommerce.product_viewed' },
        { label: 'Cart Updated', value: 'ecommerce.cart_updated' },
        { label: 'Checkout Started', value: 'ecommerce.checkout_started' },
        { label: 'Order Placed', value: 'ecommerce.order_placed' },
        { label: 'Order Cancelled', value: 'ecommerce.order_cancelled' },
        { label: 'Order Refunded', value: 'ecommerce.order_refunded' }
      ]
    },
    time: {
      label: 'Time',
      description: 'Timestamp for when the event occurred.',
      type: 'string',
      format: 'date-time',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    checkout_id: {
      label: 'Checkout ID',
      description: 'Unique identifier for the checkout.',
      type: 'string',
      default: {
        '@path': '$.properties.checkout_id'
      }
    },
    order_id: {
      label: 'Order ID',
      description: 'Unique identifier for the order placed.',
      type: 'string',
      default: {
        '@path': '$.properties.order_id'
      }
    },
    cart_id: {
      label: 'Cart ID',
      description: 'Unique identifier for the cart. If no value is passed, Braze will determine a default value (shared across cart, checkout, and order events) for the user cart mapping.',
      type: 'string',
      default: {
        '@path': '$.properties.cart_id'
      }
    },
    total_value: {
      label: 'Total Value',
      description: 'Total monetary value of the cart.',
      type: 'number',
      default: {
        '@path': '$.properties.total'
      }
    },
    total_discounts: {
      label: 'Total Discounts',
      description: 'Total amount of discounts applied to the order.',
      type: 'number',
      default: {
        '@path': '$.properties.discount'
      }
    },
    discounts: {
      label: 'Discounts',
      description: 'Details of all discounts applied to the order.',
      type: 'object',
      multiple: true,
      defaultObjectUI: 'keyvalue',
      additionalProperties: false,
      properties: {
        code: {
          label: 'Discount Code',
          type: 'string',
          required: true
        },
        amount: {
          label: 'Discount Amount',
          type: 'number',
          required: true
        }
      },
      default: {
        '@arrayPath': [
          '$.properties,discount_items',
          {
            code: {
              '@path': '$.code'
            },
            amount: {
              '@path': '$.amount'
            }
          }
        ]
      }
    },
    currency: {
      label: 'Currency',
      description: 'Currency code for the transaction. Defaults to USD if no value passed.',
      type: 'string',
      default: {
        '@path': '$.properties.currency'
      },
      choices: currencies()
    },
    source: {
      label: 'Source',
      description: 'Source the event is derived from.',
      type: 'string',
      default: {
        '@path': '$.properties.source'
      }
    },
    checkout_url: {
      label: 'Checkout URL',
      description: 'The URL of the checkout page.',
      type: 'string',
      default: {
        '@path': '$.properties.checkout_url'
      }
    },
    products: {
      label: 'Products',
      description: 'List of products associated with the ecommerce event.',
      type: 'object',
      multiple: true,
      required: true,
      additionalProperties: true,
      properties: {
        product_id: {
          label: 'Product ID',
          description: 'A unique identifier for the product that was viewed. This value be can be the product ID or SKU',
          type: 'string',
          required: true
        },
        product_name: {
          label: 'Product Name',
          description: 'The name of the product that was viewed.',
          type: 'string',
          required: true
        },
        variant_id: {
          label: 'Variant ID',
          description: 'A unique identifier for the product variant. An example is shirt_medium_blue',
          type: 'string',
          required: true
        },
        image_url: {
          label: 'Image URL',
          description: 'The URL of the product image.',
          type: 'string'
        },
        product_url: {
          label: 'Product URL',
          description: 'URL to the product page for more details.',
          type: 'string'
        },
        quantity: {
          label: 'Quantity',
          description: 'Number of units of the product in the cart.',
          type: 'number',
          required: true
        },
        price: {
          label: 'Price',
          description: 'The variant unit price of the product at the time of viewing.',
          type: 'number',
          required: true
        }
      },
      default: {
        '@arrayPath': [
          '$.properties,products',
          {
            product_id: {
              '@path': '$.product_id'
            },
            product_name: {
              '@path': '$.name'
            },
            variant_id: {
              '@path': '$.variant'
            },
            image_url: {
              '@path': '$.image_url'
            },
            product_url: {
              '@path': '$.url'
            },
            quantity: {
              '@path': '$.quantity'
            },
            price: {
              '@path': '$.price'
            }
          }
        ]
      }
    },
    metadata: {
      label: 'Metadata',
      description: 'Additional metadata for the ecommerce event.',
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
      properties: {
        checkout_url: {
          label: 'Checkout URL',
          description: 'URL for the checkout page.',
          type: 'string'  
        },
        order_status_url: {
          label: 'Order Status URL',
          description: 'URL to view the status of the order.',
          type: 'string'
        }
      }
    }
  },
  perform: (request, data) => {
    
  }
}

export default action
