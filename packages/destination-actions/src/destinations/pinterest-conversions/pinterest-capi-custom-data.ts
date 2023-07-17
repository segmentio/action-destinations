import { InputField } from '@segment/actions-core/destination-kit/types'

export const custom_data_field: InputField = {
  label: 'Custom Data',
  description: 'Object containing customer information data.',
  type: 'object',
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
      label: 'Gender',
      description: 'Gender in lowercase. Either f or m.',
      type: 'object',
      multiple: true,
      properties: {
        item_price: {
          label: 'Price',
          type: 'number',
          description: 'The price of the Item'
        },
        quantity: {
          label: 'quantity',
          type: 'integer',
          description: 'The number of items purchased'
        }
      }
    },
    num_items: {
      label: 'Number of Items',
      description: 'Total number of products in the event. ',
      type: 'string'
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
        'opt_out_type is the field where we accept opt outs for your users’ privacy preference.  It can handle multiple values with commas separated.',
      type: 'string'
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
}
