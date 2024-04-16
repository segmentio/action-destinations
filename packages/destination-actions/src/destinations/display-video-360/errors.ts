import { ErrorCodes, IntegrationError, InvalidAuthenticationError } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'

import { GoogleAPIError } from './types'

const isGoogleAPIError = (error: unknown): error is GoogleAPIError => {
  if (typeof error === 'object' && error !== null) {
    const e = error as GoogleAPIError
    // Not using any forces us to check for all the properties we need.
    return (
      typeof e.response === 'object' &&
      e.response !== null &&
      typeof e.response.data === 'object' &&
      e.response.data !== null &&
      typeof e.response.data.error === 'object' &&
      e.response.data.error !== null
    )
  }
  return false
}

// This method follows the retry logic defined in IntegrationError in the actions-core package
export const handleRequestError = (error: unknown, statsName: string, statsContext: StatsContext | undefined) => {
  const { statsClient, tags: statsTags } = statsContext || {}

  if (!isGoogleAPIError(error)) {
    if (!error) {
      statsTags?.push('error:unknown')
      statsClient?.incr(`${statsName}.error`, 1, statsTags)
      return new IntegrationError('Unknown error', 'UNKNOWN_ERROR', 500)
    }
  }

  const gError = error as GoogleAPIError
  const code = gError.response?.status

  // @ts-ignore - Errors can be objects or arrays of objects. This will work for both.
  const message = gError.response?.data?.error?.message || gError.response?.data?.[0]?.error?.message

  if (code === 401) {
    statsTags?.push('error:invalid-authentication')
    statsClient?.incr(`${statsName}.error`, 1, statsTags)
    return new InvalidAuthenticationError(message, ErrorCodes.INVALID_AUTHENTICATION)
  }

  if (code === 403) {
    statsTags?.push('error:forbidden')
    statsClient?.incr(`${statsName}.error`, 1, statsTags)
    return new IntegrationError(message, 'FORBIDDEN', 403)
  }

  if (code === 501) {
    statsTags?.push('error:integration-error')
    statsClient?.incr(`${statsName}.error`, 1, statsTags)
    return new IntegrationError(message, 'INTEGRATION_ERROR', 501)
  }

  if (code === 408 || code === 423 || code === 429 || code >= 500) {
    statsTags?.push('error:retryable-error')
    statsClient?.incr(`${statsName}.error`, 1, statsTags)
    return new IntegrationError(message, 'RETRYABLE_ERROR', code)
  }

  statsTags?.push('error:generic-error')
  statsClient?.incr(`${statsName}.error`, 1, statsTags)
  return new IntegrationError(message, 'INTEGRATION_ERROR', code)
}
