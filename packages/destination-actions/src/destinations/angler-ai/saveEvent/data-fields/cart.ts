import { InputField } from '@segment/actions-core/index'

export const cart: InputField = {
  label: 'Cart',
  type: 'object',
  description: 'Details of the shopping cart.',
  properties: {
    id: {
      label: 'Cart ID',
      type: 'string',
      description: 'A globally unique identifier for the cart.'
    },
    totalQuantity: {
      label: 'Total Quantity',
      type: 'number',
      description: 'The total number of items in the cart.'
    },
    totalAmount: {
      label: 'Total Amount',
      type: 'number',
      description: 'Decimal money amount.'
    },
    currencyCode: {
      label: 'Currency Code',
      type: 'string',
      description: 'The currency code of the money.'
    }
  }
}

export const cartDefault = {
  id: { '@path': '$.properties.cart.id' },
  totalQuantity: { '@path': '$.properties.cart.totalQuantity' },
  totalAmount: { '@path': '$.properties.cart.totalAmount' },
  currencyCode: { '@path': '$.properties.cart.currencyCode' }
}
