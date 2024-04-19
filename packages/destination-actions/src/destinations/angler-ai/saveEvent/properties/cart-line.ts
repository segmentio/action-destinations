import { InputField, PathDirective } from '@segment/actions-core/index'
import { merchandiseDefaultFields, merchandiseProperties } from './merchandise'
import { moneyAmountProperties } from './money'

export const cartLineProperties: Record<string, InputField> = {
  quantity: {
    label: 'Quantity',
    type: 'number',
    description: 'The quantity of the merchandise that the customer intends to purchase.'
  },
  cost: {
    label: 'Item Cost',
    type: 'object',
    description: 'Cost of the merchandise line that the buyer will pay at checkout.',
    properties: {
      totalAmount: {
        label: 'Total Amount',
        type: 'object',
        description: 'A monetary value with currency.',
        properties: moneyAmountProperties
      }
    }
  },
  merchandise: {
    label: 'Merchandise',
    type: 'object',
    description: 'Product variant of the line item.',
    properties: merchandiseProperties
  }
}

export function cartLineDefaultFields(path = ''): Record<string, object | PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    quantity: { '@path': `${path}quantity` },
    cost: {
      totalAmount: { '@path': `${path}cost.totalAmount` }
    },
    merchandise: merchandiseDefaultFields(`${path}merchandise`)
  }
}
