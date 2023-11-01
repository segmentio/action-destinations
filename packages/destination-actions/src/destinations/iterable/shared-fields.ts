import { InputField } from '@segment/actions-core'

/**
 * Common fields used by Iterable's API that also have consistent default mappings
 */
export const EMAIL_FIELD: InputField = {
  label: 'Email Address',
  description: 'An email address that identifies a user profile in Iterable.',
  type: 'string',
  format: 'email',
  required: false,
  default: {
    '@if': {
      exists: { '@path': '$.properties.email' },
      then: { '@path': '$.properties.email' },
      else: { '@path': '$.context.traits.email' }
    }
  }
}

export const USER_ID_FIELD: InputField = {
  label: 'User ID',
  description: 'A user ID that identifies a user profile in Iterable.',
  type: 'string',
  required: false,
  default: { '@path': '$.userId' }
}

export const USER_DATA_FIELDS: InputField = {
  label: 'User Data Fields',
  description: 'Data to store on the user profile.',
  type: 'object',
  required: false,
  default: { '@path': '$.traits' }
}

export const USER_PHONE_NUMBER_FIELD: InputField = {
  label: 'User Phone Number',
  description: 'User phone number. Must be a valid phone number including country code. e.g. +14158675309',
  type: 'string',
  required: false,
  default: { '@path': '$.traits.phone' }
}

export const EVENT_DATA_FIELDS: InputField = {
  label: 'Event Data Fields',
  description: 'Additional event properties.',
  type: 'object',
  required: false,
  default: { '@path': '$.properties' }
}

export const CREATED_AT_FIELD: InputField = {
  label: 'Timestamp',
  description: 'Time the event took place.',
  type: 'datetime',
  required: false,
  default: { '@path': '$.timestamp' }
}

export const CAMPAGIN_ID_FIELD: InputField = {
  label: 'Campaign ID',
  description: 'Iterable campaign the event can be attributed to.',
  type: 'integer',
  required: false,
  default: { '@path': '$.properties.campaignId' }
}

export const TEMPLATE_ID_FIELD: InputField = {
  label: 'Template ID',
  description: 'Iterable template the event can be attributed to.',
  type: 'integer',
  required: false,
  default: { '@path': '$.properties.templateId' }
}

export const MERGE_NESTED_OBJECTS_FIELD: InputField = {
  label: 'Merge Nested Objects',
  description:
    "If you'd like to merge (rather than overwrite) a user profile's top-level objects with the values provided for them in the request body, set mergeNestedObjects to true.",
  type: 'boolean',
  required: false,
  default: false
}

export const ITEMS_FIELD: InputField = {
  label: 'Cart items',
  description:
    'Individual items in the cart. Each item must contain `id`, `name`, `price`, and `quantity`. Extra values are added to dataFields.',
  type: 'object',
  multiple: true,
  additionalProperties: true,
  required: true,
  properties: {
    id: {
      label: 'Product Id',
      description: 'The unique identifier of the commerce item in the cart.',
      type: 'string',
      required: true
    },
    name: {
      label: 'Product Name',
      description: 'The name or title of the product in the cart.',
      type: 'string',
      required: true
    },
    sku: {
      label: 'Product SKU',
      description: 'The Stock Keeping Unit (SKU) code that identifies the specific product.',
      type: 'string'
    },
    quantity: {
      label: 'Quantity',
      description: 'The quantity of the product in the cart.',
      type: 'integer',
      required: true
    },
    price: {
      label: 'Price',
      description: 'The unit price of the product in the cart.',
      type: 'number',
      required: true
    },
    description: {
      label: 'Product Description',
      description: 'A brief description of the product in the cart.',
      type: 'string'
    },
    categories: {
      label: 'Product Category',
      description: 'A category name or label associated with the product in the cart.',
      type: 'string'
    },
    url: {
      label: 'Product URL',
      description: 'The URL to view or purchase the product in the cart.',
      type: 'string'
    },
    imageUrl: {
      label: 'Product Image URL',
      description: 'The URL of an image representing the product in the cart.',
      type: 'string'
    }
  },
  default: {
    '@arrayPath': [
      '$.properties.products',
      {
        id: {
          '@path': 'product_id'
        },
        sku: {
          '@path': 'sku'
        },
        categories: {
          '@path': 'category'
        },
        name: {
          '@path': 'name'
        },
        price: {
          '@path': 'price'
        },
        quantity: {
          '@path': 'quantity'
        },
        url: {
          '@path': 'url'
        },
        imageUrl: {
          '@path': 'image_url'
        },
        description: {
          '@path': 'description'
        }
      }
    ]
  }
}

export type CommerceItem = {
  id?: string
  name?: string
  sku?: string
  quantity?: number
  price?: number
  description?: string
  categories?: string[]
  url?: string
  imageUrl?: string
  dataFields?: {
    [k: string]: unknown
  }
}

export type DataCenterLocation = 'united_states' | 'europe'
