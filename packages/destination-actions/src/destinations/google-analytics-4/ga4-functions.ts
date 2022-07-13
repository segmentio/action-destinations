import { IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from './constants'

// Google expects currency to be a 3-letter ISO 4217 format
export function verifyCurrency(currency: string): void {
  if (!CURRENCY_ISO_CODES.includes(currency.toUpperCase())) {
    throw new IntegrationError(`${currency} is not a valid currency code.`, 'Incorrect value format', 400)
  }
}

// Ensure the values in params match Googles expectations
export function verifyParams(params: object | undefined): void {
  if (!params) {
    return
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
}

export function verifyUserProps(userProperties: object | undefined): void {
  if (!userProperties) {
    return
  }

  Object.entries(userProperties).forEach(([_, value]) => {
    if (typeof value != 'string' && typeof value != 'number' && value != null) {
      throw new IntegrationError(
        'GA4 only accepts string, number or null values for user properties. Please ensure you are not including array or nested values.',
        'Invalid value',
        400
      )
    }
  })
}

// Google expects timestamps to be in Unix microseconds
export function convertTimestamp(timestamp: string | undefined): number | undefined {
  if (!timestamp) {
    return undefined
  }

  // verify that timestamp is not already in unix
  if (!isNaN(+timestamp)) {
    return +timestamp
  }

  // converts non-unix timestamp to unix microseconds
  return Date.parse(timestamp) * 1000
}
