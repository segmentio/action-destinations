import { products } from './productsFields'
import { InputField } from '@segment/actions-core/index'

export const cart: Record<string, InputField> = {
  cartId: {
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
  },
  cartLines: {
    ...products,
    label: 'Cart Line Items',
    description: 'Cart Line Item details',
    properties: {
      ...products.properties,
      quantity: {
        label: 'Quantity',
        type: 'number',
        description: 'Quantity of the item'
      }
    }
  }
}
