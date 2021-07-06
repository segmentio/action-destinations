import { CustomError } from 'ts-custom-error'

/**
 * Error due to generic misconfiguration of user settings.
 * Should include a user-friendly message, and optionally an error reason and status code.
 * - 4xx errors are not automatically retried, except for 408, 423, 429
 * - 5xx are automatically retried, except for 501
 */
export class IntegrationError extends CustomError {
  code: string | undefined
  status: number | undefined

  /**
   * @param message - a human-friendly message to display to users
   * @param code - an optional error code/reason
   * @param status - an optional http status code (e.g. 400)
   */
  constructor(message = '', code?: string, status?: number) {
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
 * This error signals to Segment that the user must manually fix their credentials for events to succeed.
 */
export class InvalidAuthenticationError extends CustomError {
  status = 401
  code = 'invalid_authentication'

  constructor(message = '') {
    super(message)
  }
}
