import { CustomError } from 'ts-custom-error'

/**
 * Error due to generic misconfiguration of user settings
 * Should include a user-friendly message, an error reason and status code.
 * - 4xx errors are not automatically retried, except for 408, 423, 429
 * - 5xx are automatically retried, except for 501
 */
export class IntegrationError extends CustomError {
  code: string | undefined
  status: number | undefined
  retry?: boolean

  /**
   * @param message - a human-friendly message to display to users
   * @param code - error code/reason
   * @param status - http status code (e.g. 400)
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
export enum HttpErrorCodes {
  CONTINUE = 'CONTINUE',
  SWITCHING_PROTOCOLS = 'SWITCHING_PROTOCOLS',
  PROCESSING = 'PROCESSING',
  EARLY_HINTS = 'EARLY_HINTS',
  OK = 'OK',
  CREATED = 'CREATED',
  ACCEPTED = 'ACCEPTED',
  NON_AUTHORITATIVE_INFORMATION = 'NON_AUTHORITATIVE_INFORMATION',
  NO_CONTENT = 'NO_CONTENT',
  RESET_CONTENT = 'RESET_CONTENT',
  PARTIAL_CONTENT = 'PARTIAL_CONTENT',
  MULTI_STATUS = 'MULTI_STATUS',
  ALREADY_REPORTED = 'ALREADY_REPORTED',
  IM_USED = 'IM_USED',
  MULTIPLE_CHOICES = 'MULTIPLE_CHOICES',
  MOVED_PERMENANTLY = 'MOVED_PERMENANTLY',
  FOUND = 'FOUND',
  SEE_OTHER = 'SEE_OTHER',
  NOT_MODIFIED = 'NOT_MODIFIED',
  USE_PROXY = 'USE_PROXY',
  SWITCH_PROXY = 'SWITCH_PROXY',
  TEMPORARY_REDIRECT = 'TEMPORARY_REDIRECT',
  PERMANENT_REDIRECT = 'PERMANENT_REDIRECT',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  NOT_ACCEPTABLE = 'NOT_ACCEPTABLE',
  PROXY_AUTHENTICATION_REQUIRED = 'PROXY_AUTHENTICATION_REQUIRED',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  CONFLICT = 'CONFLICT',
  GONE = 'GONE',
  LENGTH_REQUIRED = 'LENGTH_REQUIRED',
  PRECONDITION_FAILED = 'PRECONDITION_FAILED',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  URI_TOO_LONG = 'URI_TOO_LONG',
  UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE',
  RANGE_NOT_SATISFIABLE = 'RANGE_NOT_SATISFIABLE',
  EXPECTATION_FAILED = 'EXPECTATION_FAILED',
  IM_A_TEAPOT = 'IM_A_TEAPOT',
  MISDIRECTED_REQUEST = 'MISDIRECTED_REQUEST',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  LOCKED = 'LOCKED',
  FAILED_DEPENDENCY = 'FAILED_DEPENDENCY',
  TOO_EARLY = 'TOO_EARLY',
  UPGRADE_REQUIRED = 'UPGRADE_REQUIRED',
  PRECONDITION_REQUIRED = 'PRECONDITION_REQUIRED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  REQUEST_HEADER_FIELDS_TOO_LARGE = 'REQUEST_HEADER_FIELDS_TOO_LARGE',
  UNAVAILABLE_FOR_LEGAL_REASONS = 'UNAVAILABLE_FOR_LEGAL_REASONS',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  BAD_GATEWAY = 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  HTTP_VERSION_NOT_SUPPORTED = 'HTTP_VERSION_NOT_SUPPORTED',
  VARIANT_ALSO_NEGOTIATES = 'VARIANT_ALSO_NEGOTIATES',
  INSUFFICIENT_STORAGE = 'INSUFFICIENT_STORAGE',
  LOOP_DETECTED = 'LOOP_DETECTED',
  BANDWIDTH_LIMIT_EXCEEDED = 'BANDWIDTH_LIMIT_EXCEEDED',
  NOT_EXTENDED = 'NOT_EXTENDED',
  NETWORK_AUTHENTICATION_REQUIRED = 'NETWORK_AUTHENTICATION_REQUIRED',
  SITE_IS_OVERLOADED = 'SITE_IS_OVERLOADED',
  CANCELLED = 'CANCELLED'
}

export enum CustomErrorCodes {
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
  SELF_TIMEOUT = 'SELF_TIMEOUT',

  // Fallback error code if no other error code matches
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

const HTTP_ERROR_CODE_MAP: Record<number, HttpErrorCodes> = {
  100: HttpErrorCodes.CONTINUE,
  101: HttpErrorCodes.SWITCHING_PROTOCOLS,
  102: HttpErrorCodes.PROCESSING,
  103: HttpErrorCodes.EARLY_HINTS,
  200: HttpErrorCodes.OK,
  201: HttpErrorCodes.CREATED,
  202: HttpErrorCodes.ACCEPTED,
  203: HttpErrorCodes.NON_AUTHORITATIVE_INFORMATION,
  204: HttpErrorCodes.NO_CONTENT,
  205: HttpErrorCodes.RESET_CONTENT,
  206: HttpErrorCodes.PARTIAL_CONTENT,
  207: HttpErrorCodes.MULTI_STATUS,
  208: HttpErrorCodes.ALREADY_REPORTED,
  226: HttpErrorCodes.IM_USED,
  300: HttpErrorCodes.MULTIPLE_CHOICES,
  301: HttpErrorCodes.MOVED_PERMENANTLY,
  302: HttpErrorCodes.FOUND,
  303: HttpErrorCodes.SEE_OTHER,
  304: HttpErrorCodes.NOT_MODIFIED,
  305: HttpErrorCodes.USE_PROXY,
  306: HttpErrorCodes.SWITCH_PROXY,
  307: HttpErrorCodes.TEMPORARY_REDIRECT,
  308: HttpErrorCodes.PERMANENT_REDIRECT,
  400: HttpErrorCodes.BAD_REQUEST,
  401: HttpErrorCodes.UNAUTHORIZED,
  402: HttpErrorCodes.PAYMENT_REQUIRED,
  403: HttpErrorCodes.FORBIDDEN,
  404: HttpErrorCodes.NOT_FOUND,
  405: HttpErrorCodes.METHOD_NOT_ALLOWED,
  406: HttpErrorCodes.NOT_ACCEPTABLE,
  407: HttpErrorCodes.PROXY_AUTHENTICATION_REQUIRED,
  408: HttpErrorCodes.REQUEST_TIMEOUT,
  409: HttpErrorCodes.CONFLICT,
  410: HttpErrorCodes.GONE,
  411: HttpErrorCodes.LENGTH_REQUIRED,
  412: HttpErrorCodes.PRECONDITION_FAILED,
  413: HttpErrorCodes.PAYLOAD_TOO_LARGE,
  414: HttpErrorCodes.URI_TOO_LONG,
  415: HttpErrorCodes.UNSUPPORTED_MEDIA_TYPE,
  416: HttpErrorCodes.RANGE_NOT_SATISFIABLE,
  417: HttpErrorCodes.EXPECTATION_FAILED,
  418: HttpErrorCodes.IM_A_TEAPOT,
  421: HttpErrorCodes.MISDIRECTED_REQUEST,
  422: HttpErrorCodes.UNPROCESSABLE_ENTITY,
  423: HttpErrorCodes.LOCKED,
  424: HttpErrorCodes.FAILED_DEPENDENCY,
  425: HttpErrorCodes.TOO_EARLY,
  426: HttpErrorCodes.UPGRADE_REQUIRED,
  428: HttpErrorCodes.PRECONDITION_REQUIRED,
  429: HttpErrorCodes.TOO_MANY_REQUESTS,
  431: HttpErrorCodes.REQUEST_HEADER_FIELDS_TOO_LARGE,
  451: HttpErrorCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
  499: HttpErrorCodes.CANCELLED,
  500: HttpErrorCodes.INTERNAL_SERVER_ERROR,
  501: HttpErrorCodes.NOT_IMPLEMENTED,
  502: HttpErrorCodes.BAD_GATEWAY,
  503: HttpErrorCodes.SERVICE_UNAVAILABLE,
  504: HttpErrorCodes.GATEWAY_TIMEOUT,
  505: HttpErrorCodes.HTTP_VERSION_NOT_SUPPORTED,
  506: HttpErrorCodes.VARIANT_ALSO_NEGOTIATES,
  507: HttpErrorCodes.INSUFFICIENT_STORAGE,
  508: HttpErrorCodes.LOOP_DETECTED,
  509: HttpErrorCodes.BANDWIDTH_LIMIT_EXCEEDED,
  510: HttpErrorCodes.NOT_EXTENDED,
  511: HttpErrorCodes.NETWORK_AUTHENTICATION_REQUIRED,
  529: HttpErrorCodes.SITE_IS_OVERLOADED
}

export const ErrorCodes = {
  ...HttpErrorCodes,
  ...CustomErrorCodes
}

export function getErrorCodeFromHttpStatus(status: number): keyof typeof ErrorCodes {
  return HTTP_ERROR_CODE_MAP[status] || ErrorCodes.UNKNOWN_ERROR
}

export enum MultiStatusErrorReporter {
  // Error occurred in the source
  INTEGRATIONS = 'INTEGRATIONS',
  // Error occurred in the performBatchBlock
  DESTINATION = 'DESTINATION'
}
