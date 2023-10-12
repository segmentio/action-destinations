import { CustomError } from 'ts-custom-error'

/**
 * Error due to generic misconfiguration of user settings.
 * Should include a user-friendly message, an error reason and status code.
 * - 4xx errors are not automatically retried, except for 408, 423, 429
 * - 5xx are automatically retried, except for 501
 */
export class IntegrationError extends CustomError {
  code: string | undefined
  status: number | undefined

  /**
   * @param message - a human-friendly message to display to users
   * @param code - error code/reason
   * @param status - http status code (e.g. 400).
   *    - 4xx errors are not automatically retried, except for 408, 423, 429
   *    - 5xx are automatically retried, except for 501
   */
  constructor(message: string, code: string, status: number) {
    super(message)
    this.status = status
    this.code = code
  }
}

type RetryableStatusCodes =
  | 408
  | 423
  | 429
  | 500
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 508
  | 509
  | 510
  | 511
  | 598
  | 599

/**
 * Error that should halt execution but allows the request to be retried automatically.
 * This error signals to Segment that a transient error occurred, and retrying the request may succeed without user intervention.
 */
export class RetryableError extends CustomError {
  status: RetryableStatusCodes
  code = ErrorCodes.RETRYABLE_ERROR

  constructor(message = '', status: RetryableStatusCodes = 500) {
    super(message)
    this.status = status
  }
}

/**
 * Error for when a user's authentication is not valid.
 * This could happen when a token or API key has expired or been revoked,
 * or various other scenarios where the authentication credentials are no longer valid.
 *
 * This error signals to Segment that the user must manually fix their credentials for events to succeed
 */
export class InvalidAuthenticationError extends CustomError {
  status = 401
  code: string
  constructor(message = '', code = ErrorCodes.INVALID_AUTHENTICATION) {
    super(message)
    this.code = code
  }
}

/**
 * Error to indicate the payload is missing fields that are required.
 * Should include a user-friendly message.
 * These errors will not be retried and the user has to fix the payload.
 */
export class PayloadValidationError extends IntegrationError {
  /**
   * @param message - a human-friendly message to display to users
   */
  constructor(message: string) {
    super(message, ErrorCodes.PAYLOAD_VALIDATION_FAILED, 400)
  }
}

/**
 * Error to indicate HTTP API call to destination failed.
 * Should include a user-friendly message and status code.
 * Errors will be retried based on status code.
 */
export class APIError extends IntegrationError {
  constructor(message: string, status: number) {
    super(message, status.toString(), status)
  }
}

/**
 * Error to indicate the destination has gone over its allotted execution time
 * and is self-terminating.
 * This is typically used when the destination makes calls using a stack other than the
 * HTTP/S RequestClient.
 * Error will be retried.
 */
export class SelfTimeoutError extends IntegrationError {
  /**
   * @param message - a human-friendly message to display to users
   */
  constructor(message: string) {
    super(message, ErrorCodes.SELF_TIMEOUT, 408)
  }
}

/**
 * Standard error codes. Use one from this enum whenever possible.
 */
export enum ErrorCodes {
  // Invalid API Key or Access Token
  INVALID_AUTHENTICATION = 'INVALID_AUTHENTICATION',
  // Payload is missing a field or has invalid value
  PAYLOAD_VALIDATION_FAILED = 'PAYLOAD_VALIDATION_FAILED',
  // The currency code is not in valid ISO format
  INVALID_CURRENCY_CODE = 'INVALID_CURRENCY_CODE',
  // Generic retryable error
  RETRYABLE_ERROR = 'RETRYABLE_ERROR',
  // Refresh token has expired
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  // OAuth refresh failed
  OAUTH_REFRESH_FAILED = 'OAUTH_REFRESH_FAILED',
  // Destination has spent more than the alloted time and needs to self-terminate
  SELF_TIMEOUT = 'SELF_TIMEOUT'
}
