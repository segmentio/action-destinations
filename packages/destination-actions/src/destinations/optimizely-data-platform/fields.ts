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

export const product_id: InputField = {
    label: 'Product ID',
    description: 'Identifier for the product',
    type: 'string',
    default: {
        '@path': '$.properties.product_id'
    }
}

export const product_sku: InputField = {
    label: 'Product SKU',
    description: 'Stock Keeping Unit for the product',
    type: 'string',
    default: {
        '@path': '$.properties.sku'
    }
}

export const price: InputField = {
    label: 'Product Price',
    description: 'Price for a single unit of the product. e.g. 9.99',
    type: 'number',
    default: {
        '@path': '$.properties.price'
    }
}

export const currency: InputField = {
    label: 'Currency',
    description: 'Currency',
    type: 'string',
    choices: [
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' }
    ],
    default: {
        '@path': '$.properties.currency'
    }
}

export const event_id: InputField = {
    label: 'Event ID',
    description: 'Event ID to maintain unique event data',
    type: 'string',
    default: {
        '@path': '$.messageId'
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
        '@path': '$.order_id'
    }
};

export const products: InputField = {
    label: 'Products',
    description: 'List of product details',
    type: 'object',
    multiple: true,
    properties: {
      product_id: {
        label: 'Product ID',
        description: 'Identifier for the product',
        type: 'string'
      },
      product_sku: {
        label: 'Product SKU',
        description: 'Identifier for the product',
        type: 'string'
      },
      price: {
        label: 'Product Price',
        description: 'Price for a single unit of the product. e.g. 9.99',
        type: 'number'
      },
      currency: {
        label: 'Currency',
        description: 'Currency',
        type: 'string',
        choices: [
            { label: 'USD', value: 'USD' },
            { label: 'EUR', value: 'EUR' }
        ]
    }
    },
    default: {
        '@arrayPath': [
            '$.properties.products',
            {
                product_id: { '@path': '$.product_id' },
                product_sku: { '@path': '$.sku' },
                price: { '@path': '$.price' },
                currency: { '@path': '$.currency' }
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