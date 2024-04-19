import { InputField, PathDirective } from '@segment/actions-core/index'
import { moneyAmountProperties, moneyAmountDefaultFields } from './money'

export const discountApplicationProperties: Record<string, InputField> = {
  allocationMethod: {
    label: 'Allocation Method',
    type: 'string',
    description: "The method by which the discount's value is applied to its entitled items."
  },
  targetSelection: {
    label: 'Target Selection',
    type: 'string',
    description: 'How the discount amount is distributed on the discounted lines.'
  },
  targetType: {
    label: 'Target Type',
    type: 'string',
    description:
      'The type of line (i.e. line item or shipping line) on an order that the discount is applicable towards.'
  },
  title: {
    label: 'Title',
    type: 'string',
    description:
      'The customer-facing name of the discount. If the type of discount is a DISCOUNT_CODE, this title attribute represents the code of the discount.'
  },
  type: {
    label: 'Type',
    type: 'string',
    description: 'The type of discount.'
  },
  value: {
    label: 'Value',
    type: 'object',
    description: 'The value of the discount application.',
    properties: {
      ...moneyAmountProperties,
      percentage: {
        label: 'Percentage',
        type: 'number',
        description: 'The percentage value of the discount application.'
      }
    }
  }
}

export function discountApplicationDefaultFields(path = ''): Record<string, object | PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    allocationMethod: { '@path': `${path}allocationMethod` },
    targetSelection: { '@path': `${path}targetSelection` },
    targetType: { '@path': `${path}targetType` },
    title: { '@path': `${path}title` },
    type: { '@path': `${path}type` },
    value: {
      ...moneyAmountDefaultFields(`${path}value`),
      percentage: { '@path': `${path}value.percentage` }
    }
  }
}
