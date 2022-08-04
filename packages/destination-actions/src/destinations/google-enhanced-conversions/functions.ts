import { IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from './constants'

export function verifyCurrency(currency: string): void {
  if (!CURRENCY_ISO_CODES.includes(currency.toUpperCase())) {
    throw new IntegrationError(`${currency} is not a valid currency code.`, 'Incorrect value format', 400)
  }
}

export const formatCustomVariables = (customVariables: object | undefined): object | undefined => {
  if (!customVariables) {
    return undefined
  }

  const variables: { conversionCustomVarable: string; value: string }[] = []

  Object.entries(customVariables).forEach(([key, value]) => {
    const variable = {
      conversionCustomVarable: key,
      value: value
    }
    variables.push(variable)
  })

  return variables
}
