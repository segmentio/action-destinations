import { InputField } from '@segment/actions-core/destination-kit/types'

export const items: InputField = {
  label: 'Items',
  type: 'object',
  multiple: true,
  required: true,
  defaultObjectUI: 'keyvalue',
  additionalProperties: false,
  properties: {
    productId: {
      label: 'productId',
      description: 'A unique identifier for the product (i.e. "T-Shirt").',
      type: 'string',
      required: true
    },
    productVariantId: {
      label: 'productVariantId',
      description: 'A unique identifier for the product variant (i.e. "Medium Blue T-Shirt").',
      type: 'string',
      required: true
    },
    productImage: {
      label: 'productImage',
      description:
        'A link to the image of the product. The image should not be larger than 500kb. This image will be used when sending MMS text messages.',
      type: 'string',
      format: 'uri',
      required: false
    },
    productUrl: {
      label: 'productUrl',
      description: 'The URL for the product.',
      type: 'string',
      format: 'uri',
      required: false
    },
    name: {
      label: 'name',
      description: 'The name of the product. This should be in a format that could be used directly in a message.',
      type: 'string',
      required: false
    },
    value: {
      label: 'value',
      description: 'The price of the product.',
      type: 'number',
      required: true
    },
    currency: {
      label: 'currency',
      description: 'Default: "USD". The currency used for the price in ISO 4217 format.',
      type: 'string',
      required: false
    },
    quantity: {
      label: 'quantity',
      description: 'The number of products.',
      type: 'integer',
      required: false
    }
  },
  default: {
    '@arrayPath': [
      '$.properties.products',
      {
        productId: { '@path': '$.product_id' },
        productVariantId: { '@path': '$.variant' },
        productImage: { '@path': '$.image_url' },
        productUrl: { '@path': '$.url' },
        name: { '@path': '$.name' },
        value: { '@path': '$.price' },
        currency: { '@path': '$.currency' },
        quantity: { '@path': '$.quantity' }
      }
    ]
  }
}

export const type: InputField = {
  label: 'Type',
  description:
    'The type of event. This name is case sensitive. "Order shipped" and "Order Shipped" would be considered different event types.',
  type: 'string',
  required: true,
  default: {
    '@path': '$.event'
  }
}

export const externalEventId: InputField = {
  label: 'External Event Id',
  description: 'A unique identifier representing this specific event. Should be a UUID format.',
  type: 'string',
  format: 'uuid',
  required: false,
  default: {
    '@path': '$.messageId'
  }
}

export const occurredAt: InputField = {
  label: 'Occurred At',
  description: 'Timestamp for the event, ISO 8601 format.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.timestamp'
  }
}

export const userIdentifiers: InputField = {
  label: 'User Identifiers',
  description: 'At least one identifier is required. Custom identifiers can be added as additional key:value pairs.',
  type: 'object',
  required: true,
  additionalProperties: true,
  defaultObjectUI: 'keyvalue:only',
  properties: {
    phone: {
      label: 'Phone',
      description: "The user's phone number in E.164 format.",
      type: 'string',
      required: false
    },
    email: {
      label: 'Email',
      description: "The user's email address.",
      type: 'string',
      format: 'email',
      required: false
    },
    clientUserId: {
      label: 'Client User ID',
      description: 'A primary ID for a user. Should be a UUID.',
      type: 'string',
      format: 'uuid',
      required: false
    }
  },
  default: {
    phone: {
      '@if': {
        exists: { '@path': '$.context.traits.phone' },
        then: { '@path': '$.context.traits.phone' },
        else: { '@path': '$.properties.phone' }
      }
    },
    email: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    },
    clientUserId: { '@path': '$.userId' }
  }
}

export const properties: InputField = {
  label: 'Properties',
  type: 'object',
  required: false,
  default: {
    '@path': '$.properties'
  }
}
