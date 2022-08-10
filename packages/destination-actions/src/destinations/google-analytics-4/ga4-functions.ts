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

  Object.values(params).forEach((value) => {
    if (typeof value == 'object' || value instanceof Array) {
      throw new IntegrationError(
        'GA4 does not accept null, array, or nested values for event parameters and item parameters. Please ensure you are using allowed data types.',
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

  Object.values(userProperties).forEach((value) => {
    // typeof null == 'object' and GA4 accepts nulls for user_properties
    if ((value != null && typeof value == 'object') || value instanceof Array) {
      throw new IntegrationError(
        'GA4 does not accept array or nested values for user properties. Please ensure you are using allowed data types.',
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
