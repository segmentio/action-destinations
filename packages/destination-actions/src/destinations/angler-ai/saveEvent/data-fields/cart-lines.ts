import { InputField } from '@segment/actions-core/index'
import { cartLineDefaultFields, cartLineProperties } from '../properties/cart-line'

export const cartLines: InputField = {
  label: 'Cart Lines',
  type: 'object',
  multiple: true,
  description: 'List of items in the cart.',
  properties: cartLineProperties
}

export const cartLinesDefault = {
  '@arrayPath': ['$.properties.cart.lines', cartLineDefaultFields()]
}
