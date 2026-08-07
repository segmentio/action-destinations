import { InputField, DependsOnConditions } from '@segment/actions-core/destination-kit/types'

export const getCustomDataField = (dependsOn: DependsOnConditions): InputField => ({
  label: '[Legacy] Custom Data',
  description: 'Object containing custom event data.',
  type: 'object',
  depends_on: dependsOn,
  properties: {
    currency: {
      label: 'Currency',
      description: 'ISO-4217 currency code. If not provided, it will default to the currency set for the ad account.',
      type: 'string'
    },
    value: {
      label: 'Value',
      description:
        'Total value of the event. E.g. if there are multiple items in a checkout event, value should be the total price of all items',
      type: 'number'
    },
    content_ids: {
      label: 'Content IDs',
      description: 'Product IDs as an array of strings',
      type: 'string',
      multiple: true
    },
    contents: {
      label: 'Product Info',
      description: 'A list of objects containing information about products.',
      type: 'object',
      multiple: true,
      properties: {
        id: {
          label: 'Id',
          type: 'string',
          description: 'The id of the Item'
        },
        item_price: {
          label: 'Price',
          type: 'number',
          description: 'The price of the Item'
        },
        quantity: {
          label: 'Quantity',
          type: 'integer',
          description: 'The number of items purchased.'
        },
        item_brand: {
          label: 'Item Brand',
          type: 'string',
          description: 'The brand of a product.'
        },
        item_brand_id: {
          label: 'Item Brand ID',
          type: 'string',
          description: 'The brand ID of a product. Max 64 characters.',
          maximum: 64
        },
        item_category: {
          label: 'Item Category',
          type: 'string',
          description: 'The category of a product.'
        },
        item_name: {
          label: 'Item Name',
          type: 'string',
          description: 'The name of a product.'
        }
      }
    },
    num_items: {
      label: 'Number of Items',
      description: 'Total number of products in the event. ',
      type: 'integer'
    },
    order_id: {
      label: 'Order ID',
      description: 'Order ID',
      type: 'string'
    },
    search_string: {
      label: 'Search string',
      description: 'Search string related to the conversion event.',
      type: 'string'
    },
    opt_out_type: {
      label: 'Opt Out Type',
      description:
        "Accepts opt outs for your users' privacy preference. Can handle multiple values with commas separated.",
      type: 'string'
    },
    content_brand: {
      label: 'Content Brand',
      description: 'The brand of the content associated with the event.',
      type: 'string'
    },
    content_category: {
      label: 'Content Category',
      description: 'The category of the content associated with the event.',
      type: 'string'
    },
    content_name: {
      label: 'Content Name',
      description: 'The name of the page or product associated with the event.',
      type: 'string'
    },
    predicted_ltv: {
      label: 'Predicted LTV',
      description: 'Predicted lifetime value of user associated with the event.',
      type: 'number'
    }
  },
  default: {
    value: {
      '@if': {
        exists: { '@path': '$.properties.price' },
        then: { '@path': '$.properties.price' },
        else: { '@path': '$.properties.value' }
      }
    },
    search_string: {
      '@path': '$.properties.query'
    },
    order_id: {
      '@path': '$.properties.order_id'
    },
    currency: {
      '@path': '$.properties.currency'
    }
  }
})

export const getCustomDataField2 = (dependsOn: DependsOnConditions): InputField => ({
  label: 'Custom Data',
  description: 'Object containing custom event data.',
  type: 'object',
  depends_on: dependsOn,
  properties: {
    currency: {
      label: 'Currency',
      type: 'string',
      description: 'ISO-4217 currency code. If not provided, it will default to the currency set for the ad account.'
    },
    value: {
      label: 'Value',
      type: 'number',
      description:
        'Total value of the event. E.g. if there are multiple items in a checkout event, value should be the total price of all items.'
    },
    content_ids: {
      label: 'Content IDs',
      type: 'string',
      multiple: true,
      description: 'Product IDs as an array of strings.'
    },
    num_items: {
      label: 'Number of Items',
      type: 'integer',
      description: 'Total number of products in the event.'
    },
    order_id: {
      label: 'Order ID',
      type: 'string',
      description: 'The order ID.'
    },
    search_string: {
      label: 'Search String',
      type: 'string',
      description: 'Search string related to the conversion event.'
    },
    opt_out_type: {
      label: 'Opt Out Type',
      type: 'string',
      description:
        "The field where Pinterest accepts opt outs for your users' privacy preference. It can handle multiple values with commas separated."
    },
    content_brand: {
      label: 'Content Brand',
      type: 'string',
      description: 'The brand of the content associated with the event.'
    },
    content_category: {
      label: 'Content Category',
      type: 'string',
      description: 'The category of the content associated with the event.'
    },
    content_name: {
      label: 'Content Name',
      type: 'string',
      description: 'The name of the page or product associated with the event.'
    },
    predicted_ltv: {
      label: 'Predicted LTV',
      type: 'number',
      description: 'Predicted lifetime value of user associated with the event.'
    }
  },
  default: {
    currency: { '@path': '$.properties.currency' },
    value: {
      '@if': {
        exists: { '@path': '$.properties.price' },
        then: { '@path': '$.properties.price' },
        else: { '@path': '$.properties.value' }
      }
    },
    order_id: { '@path': '$.properties.order_id' },
    search_string: { '@path': '$.properties.query' }
  }
})

export const getContentsField = (dependsOn: DependsOnConditions): InputField => ({
  label: 'Contents',
  description: 'A list of objects containing information about products.',
  type: 'object',
  multiple: true,
  depends_on: dependsOn,
  properties: {
    id: {
      label: 'Product ID',
      type: 'string',
      description: 'The id of the item.'
    },
    item_price: {
      label: 'Price',
      type: 'number',
      description: 'The price of the item.'
    },
    quantity: {
      label: 'Quantity',
      type: 'integer',
      description: 'The number of items purchased.'
    },
    item_brand: {
      label: 'Item Brand',
      type: 'string',
      description: 'The brand of the product.'
    },
    item_brand_id: {
      label: 'Item Brand ID',
      type: 'string',
      description: 'The brand ID of the product. Max 64 characters.'
    },
    item_category: {
      label: 'Item Category',
      type: 'string',
      description: 'The category of the product.'
    },
    item_name: {
      label: 'Item Name',
      type: 'string',
      description: 'The name of the product.'
    }
  },
  default: {
    '@arrayPath': [
      '$.properties.products',
      {
        id: { '@path': '$.product_id' },
        item_price: { '@path': '$.price' },
        quantity: { '@path': '$.quantity' },
        item_brand: { '@path': '$.brand' },
        item_category: { '@path': '$.category' },
        item_name: { '@path': '$.name' }
      }
    ]
  }
})
