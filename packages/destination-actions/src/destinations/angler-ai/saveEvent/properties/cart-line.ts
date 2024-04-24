import { InputField, PathDirective } from '@segment/actions-core/index'
import { productVariantDefaultFields, productVariantProperties } from './product-variant'
import addPrefixToProperties, { addPrefixToDefaultFields } from '../../utils'

export const cartLineProperties: Record<string, InputField> = {
  quantity: {
    label: 'Quantity',
    type: 'number',
    description: 'The quantity of the merchandise that the customer intends to purchase.'
  },
  itemCost: {
    label: 'Item Cost',
    type: 'number',
    description: 'The cost of the merchandise line that the buyer will pay at checkout.'
  },
  itemCurrencyCode: {
    label: 'Item Currency Code',
    type: 'string',
    description: 'Currency of the money.'
  },
  ...addPrefixToProperties(productVariantProperties, 'merchandise')
}

export function cartLineDefaultFields(path = ''): Record<string, object | PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    quantity: { '@path': `${path}quantity` },
    itemCost: { '@path': `${path}itemCost` },
    itemCurrencyCode: { '@path': `${path}itemCurrencyCode` },
    ...addPrefixToDefaultFields(productVariantDefaultFields(path), 'merchandise')
  }
}
