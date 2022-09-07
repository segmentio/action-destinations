import { IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from './constants'
import { createHash } from 'crypto'

export function verifyCurrency(currency: string): void {
  if (!CURRENCY_ISO_CODES.includes(currency.toUpperCase())) {
    throw new IntegrationError(`${currency} is not a valid currency code.`, 'Incorrect value format', 400)
  }
}

export const formatCustomVariables = (
  customVariables: object | undefined,
  customer_id: string | undefined
): object | undefined => {
  if (!customVariables) {
    return undefined
  }

  const variables: { conversionCustomVariable: string; value: string }[] = []

  Object.entries(customVariables).forEach(([key, value]) => {
    const variable = {
      conversionCustomVariable: `customers/${customer_id}/conversionCustomVariables/${key}`,
      value: value
    }
    variables.push(variable)
  })

  return variables
}

export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}
