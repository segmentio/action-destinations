import { ErrorCodes, IntegrationError, InvalidAuthenticationError } from '@segment/actions-core'

import { GoogleAPIError } from './types'

const isGoogleAPIError = (error: unknown): error is GoogleAPIError => {
  if (typeof error === 'object' && error !== null) {
    const e = error as GoogleAPIError
    // Not using any forces us to check for all the properties we need.
    return (
      typeof e.response === 'object' &&
      e.response !== null &&
      typeof e.response.status === 'number' &&
      typeof e.response.data === 'object' &&
      e.response.data !== null &&
      typeof e.response.data.error === 'object' &&
      e.response.data.error !== null &&
      typeof e.response.data.error.message === 'string'
    )
  }
  return false
}

// This method follows the retry logic defined in IntegrationError in the actions-core package
export const handleRequestError = (error: unknown) => {
  if (!isGoogleAPIError(error)) {
    if (!error) {
      return new IntegrationError('Unknown error', 'UNKNOWN_ERROR', 500)
    }
  }

  const gError = error as GoogleAPIError
  const code = gError.response?.status
  const message = gError.response?.data?.error?.message

  if (code === 401) {
    return new InvalidAuthenticationError(message, ErrorCodes.INVALID_AUTHENTICATION)
  }

  if (code === 501) {
    return new IntegrationError(message, 'INTEGRATION_ERROR', 501)
  }

  if (code === 408 || code === 423 || code === 429 || code >= 500) {
    return new IntegrationError(message, 'RETRYABLE_ERROR', code)
  }

  return new IntegrationError(message, 'INTEGRATION_ERROR', code)
}
