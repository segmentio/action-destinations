import { InputField, DependsOnConditions } from '@segment/actions-core/destination-kit/types'

export const custom_data_field = (dependsOn: DependsOnConditions): InputField => ({
  label: '[Legacy] Custom Data',
  description:
    'Object containing custom event data. This is the legacy format — use the new individual fields (Custom Data, Contents) when "Use Structured Fields" is selected.',
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
          label: 'quantity',
          type: 'integer',
          description: 'The number of items purchased'
        },
        item_brand: {
          label: 'Item Brand',
          type: 'string',
          description: 'The brand of a product.'
        },
        item_brand_id: {
          label: 'Item Brand ID',
          type: 'string',
          description: 'The brand ID of a product. Max 64 characters.'
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
        "opt_out_type is the field where we accept opt outs for your users' privacy preference. It can handle multiple values with commas separated.",
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
