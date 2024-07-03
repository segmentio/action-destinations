import { InputField } from '@segment/actions-core/index'
import { productsFields } from './productsFields'

export const cartFields: Record<string, InputField> = {
  cart: {
    label: 'Cart',
    type: 'object',
    description: 'Cart details',
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
  },
  cartLines: {
    ...productsFields,
    label: 'Cart Line Items',
    description: 'Cart Line Item details',
    properties: {
      ...productsFields.properties,
      quantity: {
        label: 'Quantity',
        type: 'number',
        description: 'Quantity of the item'
      }
    }
  }
}
