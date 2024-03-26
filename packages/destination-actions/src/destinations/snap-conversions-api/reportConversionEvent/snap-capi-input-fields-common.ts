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

const snap_capi_input_fields_common = {
  products
}

export default snap_capi_input_fields_common
