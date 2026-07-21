import { InputField } from '@segment/actions-core'

export const target: InputField = {
    label: 'Event Target',
    description: 'Target identifier / user identifier for the event. At least one identifier is required.',
    type: 'object',
    required: true,
    additionalProperties: false,
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
        }
    },
    default: {
        ref: { '@path': '$.userId' },
        email: {
            '@if': {
            exists: { '@path': '$.userId' },
            then: { '@path': '$.userId' },
            else: { '@path': '$.anonymousId' }
            }
        }
    }
} 

export const eventType: InputField = {
    label: 'Event Type',
    description: 'Type of event being sent.',
    type: 'string',
    required: true,
    choices: [
        { label: 'Purchase', value: 'p'},
        { label: 'Transaction', value: 'f'}
    ],
    default: 'p'
}

export const eventData: InputField = {
    label: 'Event Data',
    description: 'Ecommerce event data including total and products.',
    type: 'object',
    required: false,
    additionalProperties: false,
    properties: {
    total: {
        label: 'Total',
        description: 'Total value of the transaction.',
        type: 'number',
        required: false
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
    default: {
        total: { '@path': '$.properties.total' },
        currency: { '@path': '$.properties.currency' },
        order_id: { '@path': '$.properties.order_id' }
    }
}

export const products: InputField = {
    label: 'Products',
    description: 'Array of products in the transaction.',
    type: 'object',
    multiple: true,
    required: false,
    additionalProperties: true,
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
    },
    default: {
        '@arrayPath': [
            '$.properties.products',
            {
            sku: {
                '@path': '$.sku'
            },
            price: {
                '@path': '$.price'
            },
            quantity: {
                '@path': '$.quantity'
            },
            name: {
                '@path': '$.name'
            },
            category: {
                '@path': '$.category'
            }
        }]
    }
}