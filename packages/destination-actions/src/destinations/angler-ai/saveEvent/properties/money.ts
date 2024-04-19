import { InputField, PathDirective } from '@segment/actions-core/index'

export const moneyAmountProperties: Record<string, InputField> = {
  amount: {
    type: 'number',
    label: 'Amount',
    description: 'Decimal money amount.'
  },
  currencyCode: {
    type: 'string',
    label: 'Currency Code',
    description: 'Currency of the money.'
  }
}

export function moneyAmountDefaultFields(path = ''): Record<string, object | PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    amount: { '@path': `${path}amount` },
    currencyCode: { '@path': `${path}currencyCode` }
  }
}
