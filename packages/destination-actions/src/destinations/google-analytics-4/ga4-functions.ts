import { IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from './constants'

// Google expects currency to be a 3-letter ISO 4217 format
export function verifyCurrency(currency: string): void {
  if (!CURRENCY_ISO_CODES.includes(currency.toUpperCase())) {
    throw new IntegrationError(`${currency} is not a valid currency code.`, 'Incorrect value format', 400)
  }
}

// Ensure the values in params match Googles expectations
export function verifyParams(params: object | undefined): object | undefined {
  if (!params) {
    return undefined
  }

  Object.entries(params).forEach(([_, value]) => {
    if (typeof value != 'string' && typeof value != 'number') {
      throw new IntegrationError(
        'GA4 only accepts string or number values for event parameters and item parameters. Please ensure you are not including null, array, or nested values.',
        'Invalid value',
        400
      )
    }
  })

  return params
}
