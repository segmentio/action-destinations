import { RequestClient } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from './constants'
import { DataStreamParams } from './ga4-types'

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

export function getMobileStreamParams(
  api_secret: string,
  firebase_app_id?: string,
  app_instance_id?: string
): DataStreamParams {
  if (!firebase_app_id) {
    throw new IntegrationError(`Firebase App ID is required for mobile app streams`, 'Invalid value', 400)
  }
  if (!app_instance_id) {
    throw new IntegrationError(`Firebase App Instance ID is required for mobile app streams`, 'Invalid value', 400)
  }
  return {
    search_params: `api_secret=${api_secret}&firebase_app_id=${firebase_app_id}`,
    identifier: {
      app_instance_id
    }
  }
}

export function getWebStreamParams(api_secret: string, measurement_id?: string, client_id?: string): DataStreamParams {
  if (!measurement_id) {
    throw new IntegrationError(`Measurement ID is required for web streams`, 'Invalid value', 400)
  }
  if (!client_id) {
    throw new IntegrationError(`Client ID is required for web streams`, 'Invalid value', 400)
  }
  return {
    search_params: `api_secret=${api_secret}&measurement_id=${measurement_id}`,
    identifier: {
      client_id
    }
  }
}

export async function sendData(request: RequestClient, search_params: string, payload: { [k: string]: unknown }) {
  // Firebase App ID can contain colons(:) and they should not be encoded. Hence, interpolating search params to url string instead of passing them as search_params
  return request(`https://www.google-analytics.com/mp/collect?${search_params}`, {
    method: 'POST',
    json: payload
  })
}
