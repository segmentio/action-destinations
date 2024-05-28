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
  id: { '@path': '$.properties.cart_id' },
  totalAmount: { '@path': '$.properties.total' },
  currencyCode: { '@path': '$.properties.currency' }
}
