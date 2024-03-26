import { InputField } from '@segment/actions-core/destination-kit/types'

const products: InputField = {
  label: 'Products',
  description:
    "Use this field to send details of mulitple products / items. This field overrides individual 'Item ID', 'Item Category' and 'Brand' fields. Note: total purchase value is tracked using the 'Price' field",
  type: 'object',
  multiple: true,
  additionalProperties: false,
  properties: {
    item_id: {
      label: 'Item ID',
      type: 'string',
      description:
        'Identfier for the item. International Article Number (EAN) when applicable, or other product or category identifier.',
      allowNull: false
    },
    item_category: {
      label: 'Category',
      type: 'string',
      description: 'Category of the item. This field accepts a string.',
      allowNull: false
    },
    brand: {
      label: 'Brand',
      type: 'string',
      description: 'Brand associated with the item. This field accepts a string.',
      allowNull: false
    }
  },
  default: {
    '@arrayPath': [
      '$.properties.products',
      {
        item_id: {
          '@path': 'product_id'
        },
        item_category: {
          '@path': 'category'
        },
        brand: {
          '@path': 'brand'
        }
      }
    ]
  }
}

const price: InputField = {
  label: 'Price',
  description:
    "Total value of the purchase. This should be a single number. Can be overriden using the 'Track Purchase Value Per Product' field.",
  type: 'number',
  default: {
    '@if': {
      exists: { '@path': '$.properties.revenue' },
      then: { '@path': '$.properties.revenue' },
      else: { '@path': '$.properties.total' }
    }
  }
}

const currency: InputField = {
  label: 'Currency',
  description: 'Currency for the value specified as ISO 4217 code.',
  type: 'string',
  default: {
    '@path': '$.properties.currency'
  }
}

const transaction_id: InputField = {
  label: 'Transaction ID',
  description:
    'Transaction ID or order ID tied to the conversion event. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Ads Kit events.',
  type: 'string',
  default: {
    '@path': '$.properties.order_id'
  }
}

const search_string: InputField = {
  label: 'Search String',
  description: 'The text string that was searched for.',
  type: 'string',
  default: {
    '@path': '$.properties.query'
  }
}

const page_url: InputField = {
  label: 'Page URL',
  description: 'The URL of the web page where the event took place.',
  type: 'string',
  default: {
    '@path': '$.context.page.url'
  }
}

const sign_up_method: InputField = {
  label: 'Sign Up Method',
  description: 'A string indicating the sign up method.',
  type: 'string'
}

const snap_capi_input_fields_common = {
  products,
  price,
  currency,
  transaction_id,
  search_string,
  page_url,
  sign_up_method
}

export default snap_capi_input_fields_common
