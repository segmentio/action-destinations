import { InputField } from '@segment/actions-core/destination-kit/types'

export const event_action: InputField = {
    label: 'Event Action',
    description: 'The name of the event',
    type: 'string',
    required: true,
    default: {
        '@path': '$.event'
    }
}

export const user_identifiers: InputField = {
    label: 'User identifiers',
    description: 'User identifier details to send to Optimizely. ',
    type: 'object',
    required: true,
    properties: {
        anonymousId: {
            label: 'Segment Anonymous ID',
            type: 'string',
            description: 'Segment Anonymous ID',
            required:false
        },
        userId: {
            label: 'Segment User ID',
            type: 'string',
            description: 'Segment User ID',
            required:false
        },
        email: {
            label: 'Email',
            type: 'string',
            description: 'User Email address',
            required:false
        },
        optimizely_vuid: {
            label: 'Optimizely VUID',
            type: 'string',
            description: 'Optimizely VUID - user cookie generated created by Optimizely Javascript library',
            required:false
        }
    },
    default: {
        anonymousId: {
            '@path': '$.anonymousId'
        },
        userId: {
            '@path': '$.userId'
        },
        email: {
            '@if': {
                exists: { '@path': '$.properties.email' },
                then: { '@path': '$.properties.email' },
                else: { '@path': '$.traits.email' }
            }
        },
        optimizely_vuid: {
            '@if': {
                exists: { '@path': '$.properties.optimizely_vuid' },
                then: { '@path': '$.properties.optimizely_vuid' },
                else: { '@path': '$.traits.optimizely_vuid' }
            }
        }
    }
}

export const product_id: InputField = {
    label: 'Product ID',
    description: 'Identifier for the product',
    type: 'string',
    default: {
        '@path': '$.properties.product_id'
    }
}

export const timestamp: InputField = {
    label: 'Timestamp',
    description: 'Event timestamp',
    type: 'string',
    default: {
        '@path': '$.timestamp'
    }
}

export const order_id: InputField = {
    label: 'Order ID',
    description: 'Identifier for the order',
    type: 'string',
    default: {
        '@path': '$.properties.order_id'
    }
};

export const total: InputField = {
    label: 'Order Total',
    description: 'Total value of the order',
    type: 'string',
    default: {
        '@path': '$.properties.total'
    }
};


export const products: InputField = {
    label: 'Products',
    description: 'List of product details. Product ID field is required for each product.',
    type: 'object',
    multiple: true,
    properties: {
      product_id: {
        label: 'Product ID',
        description: 'Identifier for the product',
        type: 'string'
      },
      qty: {
        label: 'Quantity',
        description: 'Quantity of the product',
        type: 'number'
      }
    },
    default: {
        '@arrayPath': [
            '$.properties.products',
            {
                product_id: { '@path': '$.product_id' },
                qty: { '@path': '$.quantity' }
            }
        ]
    }
  };

  export const email_event: InputField = {
    label: 'Email Event',
    description: 'Email details',
    type: 'string',
    required: true,
    default: {
        '@path': '$.event'
    }
};