import { InputField } from '@segment/actions-core/index'
import { moneyAmountDefaultFields, moneyAmountProperties } from '../properties/money'
import { cartLineDefaultFields, cartLineProperties } from '../properties/cart-line'

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
    cost: {
      label: 'Cost',
      type: 'object',
      description: 'The estimated costs that the customer will pay at checkout.',
      properties: {
        totalAmount: {
          label: 'Total Amount',
          type: 'object',
          description: 'A monetary value with currency.',
          properties: moneyAmountProperties
        }
      }
    },
    lines: {
      label: 'Lines',
      type: 'object',
      multiple: true,
      description: 'List of items in the cart.',
      properties: cartLineProperties
    }
  }
}

export const cartDefault = {
  id: { '@path': '$.properties.cart.id' },
  totalQuantity: { '@path': '$.properties.cart.totalQuantity' },
  cost: {
    totalAmount: moneyAmountDefaultFields('$.properties.cart.cost.totalAmount')
  },
  lines: {
    '@arrayPath': ['$.properties.cart.lines', cartLineDefaultFields()]
  }
}
