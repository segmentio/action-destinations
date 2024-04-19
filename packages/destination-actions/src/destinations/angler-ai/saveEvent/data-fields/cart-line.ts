import { InputField } from '@segment/actions-core/index'
import { cartLineDefaultFields, cartLineProperties } from '../properties/cart-line'

export const cartLine: InputField = {
  label: 'Cart Line',
  type: 'object',
  description: 'Represents information about a single line item in the shopping cart.',
  properties: cartLineProperties
}

export const cartLineDefault = cartLineDefaultFields('$.properties.cartLine')
