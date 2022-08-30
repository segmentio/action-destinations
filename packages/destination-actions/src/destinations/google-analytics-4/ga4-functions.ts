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

  Object.entries(params).forEach(([key, value]) => {
    if (value instanceof Array) {
      throw new IntegrationError(
        `Param [${key}] has unsupported value of type [Array]. GA4 does not accept null, array, or object values for event parameters and item parameters.`,
        'Invalid value',
        400
      )
    } else if (value == null) {
      throw new IntegrationError(
        `Param [${key}] has unsupported value of type [NULL]. GA4 does not accept null, array, or object values for event parameters and item parameters.`,
        'Invalid value',
        400
      )
    } else if (typeof value == 'object') {
      throw new IntegrationError(
        `Param [${key}] has unsupported value of type [${typeof value}]. GA4 does not accept null, array, or object values for event parameters and item parameters.`,
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

  Object.entries(userProperties).forEach(([key, value]) => {
    if (value instanceof Array) {
      throw new IntegrationError(
        `Param [${key}] has unsupported value of type [Array]. GA4 does not accept array or object values for user properties.`,
        'Invalid value',
        400
      )
    } else if (value != null && typeof value == 'object') {
      throw new IntegrationError(
        `Param [${key}] has unsupported value of type [${typeof value}]. GA4 does not accept array or object values for user properties.`,
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
