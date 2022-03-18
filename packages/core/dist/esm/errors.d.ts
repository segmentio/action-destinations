import { CustomError } from 'ts-custom-error'
export declare class IntegrationError extends CustomError {
  code: string | undefined
  status: number | undefined
  constructor(message?: string, code?: string, status?: number)
}
declare type RetryableStatusCodes =
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
export declare class RetryableError extends CustomError {
  status: RetryableStatusCodes
  constructor(message?: string, status?: RetryableStatusCodes)
}
export declare class InvalidAuthenticationError extends CustomError {
  status: number
  code: string
  constructor(message?: string)
}
export {}
