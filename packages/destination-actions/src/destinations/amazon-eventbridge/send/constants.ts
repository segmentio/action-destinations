export const SEGMENT_PARTNER_NAME = 'aws.partner/segment.com'

export const EBNotRetryableErrors = {
  LimitExceededException: 'NON_RETRYABLE',
  OperationDisabledException: 'NON_RETRYABLE',
  AccessDeniedException: 'NON_RETRYABLE',
  NotAuthorized: 'NON_RETRYABLE',
  IncompleteSignature: 'NON_RETRYABLE',
  InvalidAction: 'NON_RETRYABLE',
  InvalidClientTokenId: 'NON_RETRYABLE',
  OptInRequired: 'NON_RETRYABLE',
  RequestExpired: 'NON_RETRYABLE',
  ValidationError: 'NON_RETRYABLE'
} as const

export const EBRetryableErrors = {
  ConcurrentModificationException: 'RETRYABLE',
  InternalException: 'RETRYABLE',
  InternalFailure: 'RETRYABLE',
  ThrottlingException: 'RETRYABLE',
  ServiceUnavailable: 'RETRYABLE'
} as const

export const EBNotErrors = {
  ResourceAlreadyExistsException: 'NOT_AN_ERROR'
} as const

export type RetryableErrorType = keyof typeof EBRetryableErrors
export type NonRetryableErrorType = keyof typeof EBNotRetryableErrors
export type NotAnErrorType = keyof typeof EBNotErrors
