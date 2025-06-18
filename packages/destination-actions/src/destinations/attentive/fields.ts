import { InputField } from '@segment/actions-core/destination-kit/types'
import { SUBSCRIPTION_TYPE_CHOICES, TRANSACTIONAL } from './constants'

export const eventType: InputField = {
  label: 'Event Type',
  description: 'The type of ecommerce event',
  type: 'string',
  required: true,
  choices: [
    { label: 'product-view', value: 'product-view' },
    { label: 'add-to-cart', value: 'add-to-cart' },
    { label: 'purchase', value: 'purchase' }
  ]
}

export const items: InputField = {
  label: 'Items',
  description: 'List of items.',
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
    value: {
      label: 'value',
      description: 'The price of the product.',
      type: 'number',
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
        value: { '@path': '$.price' },
        productImage: { '@path': '$.image_url' },
        productUrl: { '@path': '$.url' },
        name: { '@path': '$.name' },
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
  description: 'A unique identifier representing this specific event.',
  type: 'string',
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
  description: 'Metadata to associate with the event.',
  type: 'object',
  required: false,
  default: {
    '@path': '$.properties'
  }
}

export const subscriptionType: InputField = {
  label: 'Subscription Type',
  description: 'Type of subscription',
  type: 'string',
  required: true,
  choices: SUBSCRIPTION_TYPE_CHOICES,
  default: TRANSACTIONAL
}

export const locale: InputField = {
  label: 'Locale',
  description: 'User locale. e.g. "en-US". Either Locale or Signup Source ID is required.',
  type: 'string',
  allowNull: false,
  required: {
    match: 'any',
    conditions: [
      { fieldKey: 'signUpSourceId', operator: 'is', value: undefined },
      { fieldKey: 'signUpSourceId', operator: 'is', value: "" }
    ]
  },
  default: { '@path': '$.context.locale' }
}

export const signUpSourceId: InputField = {
  label: 'Signup Source ID',
  description: 'A unique identifier for the sign up source. Talk to your Attentive represenative. Either Locale or Signup Source ID is required.',
  type: 'string',
  required: {
    match: 'any',
    conditions: [
      { fieldKey: 'locale', operator: 'is', value: undefined },
      { fieldKey: 'locale', operator: 'is', value: "" }
    ]
  }
}

export const singleOptIn: InputField = {
  label: 'Single Opt-In',
  description: 'Whether to use single opt-in for the subscription.',
  type: 'boolean',
  required: false,
  default: false
}