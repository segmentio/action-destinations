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
  label: 'User Data fields',
  description: 'Data to store on the user profile.',
  type: 'object',
  required: false,
  default: { '@path': '$.traits' }
}

export const EVENT_DATA_FIELDS: InputField = {
  label: 'Event Data fields',
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

export const PREFER_USER_ID_FIELD: InputField = {
  label: 'Prefer User ID',
  description:
    "Only respected in email-based projects. Whether or not a new user should be created if the request includes a userId that doesn't yet exist in the Iterable project.",
  type: 'boolean',
  required: false,
  default: false
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
      type: 'string',
      required: true
    },
    name: {
      label: 'Product Name',
      type: 'string',
      required: true
    },
    sku: {
      label: 'Product SKU',
      type: 'string'
    },
    quantity: {
      label: 'Quantity',
      type: 'integer',
      required: true
    },
    price: {
      label: 'Price',
      type: 'number',
      required: true
    },
    description: {
      label: 'Product Description',
      type: 'string'
    },
    categories: {
      label: 'Product Category',
      type: 'string'
    },
    url: {
      label: 'Product URL',
      type: 'string'
    },
    imageUrl: {
      label: 'Product Image URL',
      type: 'string'
    },
    dataFields: {
      label: 'Additional item properties',
      type: 'object'
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
        },
        dataFields: {
          '@path': ''
        }
      }
    ]
  }
}
