import { InputField } from '@segment/actions-core/destination-kit/types'

export const movable_ink_url: InputField = {
  label: 'Movable Ink URL',
  description: 'The Movable Ink URL to send data to. This field overrides the "Movable Ink URL" setting.',
  type: 'string',
  required: false,
  format: 'uri'
}

export const timestamp: InputField = {
    label: 'timestamp',
    description: "Timestamp for the event. Must be in ISO 8601 format. For example '2023-09-18T11:45:59.533Z'. Segment will convert to Unix time before sending to Movable Ink.",
    type: 'datetime',
    required: true,
    default: { '@path': '$.timestamp' }
}

export const timezone: InputField = {
    label: 'Timezone',
    description: "The timezone of where the event took place (TZ database name in the IANA Time Zone Database)",
    type: 'string',
    required: false,
    default: {
        '@if': {
            exists: { '@path': '$.context.timezone' },
            then: { '@path': '$.context.timezone' },
            else: { '@path': '$.properties.timezone' }
        }
    }
}

export const event_name: InputField = {
    label: 'Event Name',
    description: 'The name of the event to send',
    type: 'string',
    required: true,
    default: { '@path': '$.event' }
}

export const user_id: InputField = {
    label: 'User ID',
    description: 'The unique identifier of the profile that triggered this event.',
    type: 'string',
    required: false,
    default: { '@path': '$.userId' }
}

export const anonymous_id: InputField = {
    label: 'Anonymous ID',
    description: 'A unique identifier of the anonymous profile that triggered this event.',
    type: 'string',
    required: false,
    default: { '@path': '$.anonymousId' }
}

export const meta: InputField = {
    label: 'Metadata',
    description: 'A map of meta data to provide additional context about the event.',
    type: 'object',
    defaultObjectUI: 'keyvalue',
    additionalProperties: true,
    required: false,
    default: { '@path': '$.properties' }
}

export const query_url: InputField = {
  label: 'Query URL',
  description: 'The URL of a query the user searched with',
  type: 'string',
  required: false,
  default: { '@path': '$.properties.url' }
}

export const revenue: InputField = {
  label: 'Revenue',
  description: 'The revenue generated by the purchase',
  type: 'number',
  required: true,
  default: { '@path': '$.properties.revenue' }
}

export const revenue_required_false: InputField = {
  ...revenue,
  required: false
}

export const query: InputField = {
    label: 'Query',
    description: 'Query the user searched with',
    type: 'string',
    required: true,
    default: { '@path': '$.properties.query' }
}

export const order_id: InputField = {
    label: 'Order ID',
    description: 'Unique ID for the purchase',
    type: 'string',
    required: true,
    default: { '@path': '$.properties.order_id' }
}

export const order_id_required_false: InputField = {
  ...order_id,
  required: false
}

export const product_quantity: InputField = {
  label: 'Product Quantity',
  description: 'The quantity of the product.',
  type: 'integer',
  required: false,
  default: { '@path': '$.properties.quantity' }
}

export const product: InputField = {
  label: 'Product Details',
  description: 'Product details to associate with the event',
  type: 'object',
  required: true,
  multiple: false,
  additionalProperties: true,
  properties: {
    id: {
      label: 'Product ID',
      description: 'The unique identifier of the product.',
      type: 'string',
      required: true
    },
    title: {
      label: 'Product title',
      description: 'The title or name of the product.',
      type: 'string',
      required: false
    },
    price: {
      label: 'Product price',
      description: 'The product price.',
      type: 'number',
      required: false
    },
    url: {
      label: 'Product URL',
      description: 'The URL of the product.',
      type: 'string',
      required: false
    }
  },
  default: {
    id: { '@path': '$.product_id' },
    title: { '@path': '$.name' },
    price: { '@path': '$.price' },
    url: { '@path': '$.url' }
  }
}

export const product_with_quantity: InputField = {
  ...product, 
  properties: {
    ...product.properties,
    quantity: {
      label: 'Quantity',
      description: 'The quantity of the product.',
      type: 'integer',
      required: false
    }
  },
  default: {
    ...product.default as object, 
    quantity: { '@path': '$.quantity' }
  }
};

export const products: InputField = {
    label: 'Products',
    description: 'Product details to associate with the event.',
    type: 'object',
    required: true,
    multiple: true,
    additionalProperties: true,
    properties: {
      id: {
        label: 'Product ID',
        description: 'The unique identifier of the product.',
        type: 'string',
        required: true
      },
      title: {
        label: 'Product title',
        description: 'The title or name of the product.',
        type: 'string',
        required: false
      },
      price: {
        label: 'Product price',
        description: 'The product price.',
        type: 'number',
        required: false
      },
      url: {
        label: 'Product URL',
        description: 'The URL of the product.',
        type: 'string',
        required: false
      },
      quantity: {
        label: 'Product Quantity',
        description: 'The quantity of the product.',
        type: 'integer',
        required: false
      }
    },
    default: {
        '@arrayPath': [
            '$.properties.products',
            {
                id: { '@path': '$.product_id' },
                title: { '@path': '$.name' },
                price: { '@path': '$.price' },
                url: { '@path': '$.url' },
                quantity: { '@path': '$.quantity' }
            }
        ]
    }
}

export const products_required_false: InputField = {
  ...products,
  required: false
}


export const categories: InputField = {
  label: 'Categories',
  description: 'Product Category details',
  type: 'object',
  multiple: true,
  required: true,
  defaultObjectUI: 'keyvalue',
  additionalProperties: false,
  properties: {
    id: { label: 'Category ID', description: 'The unique identifier of the Category.', type: 'string', required: true },
    url: { label: 'Category URL', description: 'The URL of the Category', type: 'string' }
  },
  default: {
    '@arrayPath': ['$.properties.categories', { id: { '@path': '$.id' }, url: { '@path': '$.url' } }]
  }
};

export const categories_required_false: InputField = {
  ...categories, 
  required:false
}
