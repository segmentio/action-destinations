import { InputField } from '@segment/actions-core/index'
import { productFields, productDefaultProperties } from './productFields'

export const cartLineFields: Record<string, InputField> = {
  cartLine: {
    ...productFields,
    label: 'Cart Line',
    description: 'Cart Line details',
    properties: {
      ...productFields.properties,
      quantity: {
        label: 'Quantity',
        type: 'number',
        description: 'Quantity of the item'
      }
    },
    default: {
      '@arrayPath': [
        '$.properties.products',
        {
          ...productDefaultProperties,
          quantity: {
            '@path': '$.quantity'
          }
        }
      ]
    }
  }
}
