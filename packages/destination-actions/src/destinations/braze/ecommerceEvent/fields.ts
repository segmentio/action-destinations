import { InputField } from '@segment/actions-core'
import { currencies } from './functions'
import { EVENT_NAMES } from './constants'

export const name: InputField = {
    label: 'Ecommerce Event Name',
    description: 'The name of the Braze ecommerce recommended event',
    type: 'string',
    required: true,
    choices: [
        { label: 'Product Viewed', value: EVENT_NAMES.PRODUCT_VIEWED },
        { label: 'Cart Updated', value: EVENT_NAMES.CART_UPDATED },
        { label: 'Checkout Started', value: EVENT_NAMES.CHECKOUT_STARTED },
        { label: 'Order Placed', value: EVENT_NAMES.ORDER_PLACED },
        { label: 'Order Cancelled', value: EVENT_NAMES.ORDER_CANCELLED },
        { label: 'Order Refunded', value: EVENT_NAMES.ORDER_REFUNDED }
    ]
}

export const external_id: InputField = {
    label: 'External User ID',
    description: 'The unique user identifier',
    type: 'string',
    default: { '@path': '$.userId' }
}

export const user_alias: InputField = { 
    label: 'User Alias Object',
    description: 'A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).',
    type: 'object',
    defaultObjectUI: 'keyvalue',
    additionalProperties: false,
    properties: {
        alias_name: {
            label: 'Alias Name',
            type: 'string',
            required: true
        },
        alias_label: {
            label: 'Alias Label',
            type: 'string',
            required: true
        }
    }
}

export const _update_existing_only: InputField = {
    label: 'Update Existing Only',
    description: 'Setting this flag to true will put the API in "Update Only" mode. When using a "user_alias", "Update Only" mode is always true.',
    type: 'boolean',
    default: false
}

export const email: InputField = {
    label: 'Email',
    description: 'The user email',
    type: 'string',
    default: { 
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
    }
}

export const phone: InputField = {
    label: 'Phone Number',
    description: "The user's phone number",
    type: 'string',
    allowNull: true,
    default: { 
        '@if': {
          exists: { '@path': '$.context.traits.phone' },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
    }
}

export const braze_id: InputField ={
    label: 'Braze User Identifier',
    description: 'The unique user identifier',
    type: 'string',
    allowNull: true,
    default: { 
        '@if': {
          exists: { '@path': '$.context.traits.braze_id' },
          then: { '@path': '$.context.traits.braze_id' },
          else: { '@path': '$.properties.braze_id' }
        }
    }
}

export const cancel_reason: InputField = {
    label: 'Cancel Reason',
    description: 'Reason why the order was cancelled.',
    type: 'string',
    default: {'@path': '$.properties.reason'},
    required: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: EVENT_NAMES.ORDER_CANCELLED
            }
        ]
    },
    depends_on: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: EVENT_NAMES.ORDER_CANCELLED
            }
        ]
    }
}

export const time: InputField = {
    label: 'Time',
    description: 'Timestamp for when the event occurred.',
    type: 'string',
    format: 'date-time',
    required: true,
    default: {'@path': '$.timestamp'}
}

export const checkout_id: InputField = {
    label: 'Checkout ID',
    description: 'Unique identifier for the checkout.',
    type: 'string',
    default: {'@path': '$.properties.checkout_id'},
    required: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: EVENT_NAMES.CHECKOUT_STARTED
            }
        ]
    },
    depends_on: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: EVENT_NAMES.CHECKOUT_STARTED
            }
        ]
    }
}

export const order_id: InputField = {
    label: 'Order ID',
    description: 'Unique identifier for the order placed.',
    type: 'string',
    default: {'@path': '$.properties.order_id'},
    required: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: [EVENT_NAMES.ORDER_PLACED, EVENT_NAMES.ORDER_CANCELLED, EVENT_NAMES.ORDER_REFUNDED]
            }
        ]
    },
    depends_on: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: [EVENT_NAMES.ORDER_PLACED, EVENT_NAMES.ORDER_CANCELLED, EVENT_NAMES.ORDER_REFUNDED]
            }
        ]
    }
}

export const cart_id: InputField = {
    label: 'Cart ID',
    description: 'Unique identifier for the cart. If no value is passed, Braze will determine a default value (shared across cart, checkout, and order events) for the user cart mapping.',
    type: 'string',
    default: {'@path': '$.properties.cart_id'},
    required: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: [EVENT_NAMES.CART_UPDATED]
            }
        ]
    },
    depends_on: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: [EVENT_NAMES.CART_UPDATED, EVENT_NAMES.CHECKOUT_STARTED, EVENT_NAMES.ORDER_PLACED]
            }
        ]
    }
}

export const total_value: InputField = {
    label: 'Total Value',
    description: 'Total monetary value of the cart.',
    type: 'number',
    default: { '@path': '$.properties.total'},
    required: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: [EVENT_NAMES.CHECKOUT_STARTED, EVENT_NAMES.CART_UPDATED, EVENT_NAMES.ORDER_PLACED, EVENT_NAMES.ORDER_CANCELLED, EVENT_NAMES.ORDER_REFUNDED]
            }
        ]
    },
    depends_on: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: [EVENT_NAMES.CHECKOUT_STARTED, EVENT_NAMES.CART_UPDATED, EVENT_NAMES.ORDER_PLACED, EVENT_NAMES.ORDER_CANCELLED, EVENT_NAMES.ORDER_REFUNDED]
            }
        ]
    }
}

export const total_discounts: InputField = {
    label: 'Total Discounts',
    description: 'Total amount of discounts applied to the order.',
    type: 'number',
    default: { '@path': '$.properties.discount'},
    required: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: [EVENT_NAMES.ORDER_PLACED, EVENT_NAMES.ORDER_CANCELLED, EVENT_NAMES.ORDER_REFUNDED]
            }
        ]
    },
    depends_on: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: [EVENT_NAMES.ORDER_PLACED, EVENT_NAMES.ORDER_CANCELLED, EVENT_NAMES.ORDER_REFUNDED]
            }
        ]
    }
}

export const discounts: InputField = {
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
                code: {'@path': '$.code'},
                amount: {'@path': '$.amount'}
            }
        ]
    },
    required: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: [EVENT_NAMES.ORDER_PLACED, EVENT_NAMES.ORDER_CANCELLED, EVENT_NAMES.ORDER_REFUNDED]
            }
        ]
    },
    depends_on: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: [EVENT_NAMES.ORDER_PLACED, EVENT_NAMES.ORDER_CANCELLED, EVENT_NAMES.ORDER_REFUNDED]
            }
        ]
    }
}

export const currency: InputField = {
    label: 'Currency',
    description: 'Currency code for the transaction. Defaults to USD if no value passed.',
    type: 'string',
    required: true,
    default: {'@path': '$.properties.currency'},
    choices: currencies()
}

export const source: InputField = {
    label: 'Source',
    description: 'Source the event is derived from.',
    type: 'string',
    required: true,
    default: { '@path': '$.properties.source' }
}

export const products: InputField = {
    label: 'Products',
    description: 'List of products associated with the ecommerce event.',
    type: 'object',
    multiple: true,
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
            type: 'string',
            format: 'uri'
        },
        product_url: {
            label: 'Product URL',
            description: 'URL to the product page for more details.',
            type: 'string',
            format: 'uri'
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
                product_id: { '@path': '$.product_id' },
                product_name: { '@path': '$.name' },
                variant_id: { '@path': '$.variant'},
                image_url: {'@path': '$.image_url'},
                product_url: {'@path': '$.url'},
                quantity: {'@path': '$.quantity'},
                price: {'@path': '$.price'}
            }
        ]
    },
    required: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is_not',
                value: EVENT_NAMES.CART_UPDATED
            }
        ]
    },
    depends_on: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is_not',
                value: EVENT_NAMES.CART_UPDATED
            }
        ]
    }
}

export const product: InputField = {
    label: 'Product',
    description: 'Product associated with the ecommerce event.',
    type: 'object',
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
            type: 'string',
            format: 'uri'
        },
        product_url: {
            label: 'Product URL',
            description: 'URL to the product page for more details.',
            type: 'string',
            format: 'uri'
        },
        price: {
            label: 'Price',
            description: 'The variant unit price of the product at the time of viewing.',
            type: 'number',
            required: true
        }
    },
    default: { 
        product_id: { '@path': '$.properties.product_id' },
        product_name: { '@path': '$.properties.name' },
        variant_id: { '@path': '$.properties.variant'},
        image_url: {'@path': '$.properties.image_url'},
        product_url: {'@path': '$.properties.url'},
        price: {'@path': '$.properties.price'}
    },
    required: {
        match: 'all',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: EVENT_NAMES.CART_UPDATED
            }
        ]
    },
    depends_on: {
        match: 'all',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: EVENT_NAMES.CART_UPDATED
            }
        ]
    }
}

export const metadata: InputField = {
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

export const type: InputField = {
    label: 'Product Type',
    description: 'TODO: description in docs ambiguous.',
    type: 'string',
    multiple: true,
    default: { '@path': '$.properties.type' },
    required: false,
    depends_on: {
        match: 'any',
        conditions: [
            {
                fieldKey: 'name',
                operator: 'is',
                value: EVENT_NAMES.CART_UPDATED
            }
        ]
    }
}

export const enable_batching: InputField = {
    type: 'boolean',
    label: 'Batch Data to Braze',
    description: 'If true, Segment will batch events before sending to Braze’s user track endpoint.',
    required: true,
    default: true
}

export const batch_size: InputField ={
    label: 'Maximum Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    required: true,
    default: 75,
    minimum: 2,
    maximum: 75
}