import { InputField, Directive } from '@segment/actions-core/destination-kit/types'

export const event_type: InputField = {
  label: 'Optimizely Event Type',
  description: 'The Optimizely Event Type. Defaults to "custom" if not provided',
  type: 'string',
  required: false,
  default: {
    '@path': '$.event'
  }
}

export const event_action: InputField = {
  label: 'Optimizely Event Action',
  description: 'The name of the Optimizely Event Action.',
  type: 'string',
  required: false
}

export const data: InputField = {
  label: 'Event Properties',
  description: 'Additional information to send with your custom event',
  type: 'object',
  required: false,
  default: {
    '@path': '$.properties'
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
      required: false
    },
    userId: {
      label: 'Segment User ID',
      type: 'string',
      description: 'Segment User ID',
      required: false
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'User Email address',
      required: false
    },
    optimizely_vuid: {
      label: 'Optimizely VUID',
      type: 'string',
      description: 'Optimizely VUID - user cookie generated created by Optimizely Javascript library',
      required: false
    },
    fs_user_id: {
      label: 'Feature Experimentation ID',
      type: 'string',
      description: 'Feature Experimentation user ID',
      required: false
    },
    web_user_id: {
      label: 'Web Experimentation ID',
      type: 'string',
      description: 'Web User ID',
      required: false
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
    },
    fs_user_id: {
      '@path': '$.userId'
    },
    web_user_id: {
      '@path': '$.userId'
    }
  }
}

export const email_action_identifiers: InputField = {
  ...user_identifiers,
  properties: {
    ...(user_identifiers.properties ?? {}),
    email: {
      required: true,
      label: 'Email',
      type: 'string',
      description: 'User Email address. This is a required field'
    }
  },
  default: {
    ...(user_identifiers.default as Directive),
    email: {
      '@if': {
        exists: { '@path': '$.properties.email' },
        then: { '@path': '$.properties.email' },
        else: { '@path': '$.context.traits.email' }
      }
    },
    optimizely_vuid: {
      '@if': {
        exists: { '@path': '$.properties.optimizely_vuid' },
        then: { '@path': '$.properties.optimizely_vuid' },
        else: { '@path': '$.context.traits.optimizely_vuid' }
      }
    }
  }
}

export const timestamp: InputField = {
  label: 'Timestamp',
  description: 'Event timestamp',
  type: 'string',
  required: true,
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
}

export const total: InputField = {
  label: 'Order Total',
  description: 'Total value of the order',
  type: 'string',
  default: {
    '@path': '$.properties.total'
  }
}

export const products: InputField = {
  label: 'Product details',
  description: 'Product details to associate with the event. Product ID field is required for each product',
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
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of event data to Optimizely.',
  type: 'boolean',
  default: true,
  unsafe_hidden: true
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Number of events to batch before sending to Optimizely.',
  type: 'integer',
  default: 100,
  unsafe_hidden: true
}
