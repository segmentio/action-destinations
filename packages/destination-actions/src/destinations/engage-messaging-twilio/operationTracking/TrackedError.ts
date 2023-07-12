import { OperationContext } from './OperationContext'

/**
 * Error object that contains tracked data
 */
export interface TrackedError extends Error {
  /**
   * Underlying error that this error wraps
   */
  underlyingError?: unknown
  /**
   * Operation context during which the error happened
   */
  trackedContext?: OperationContext

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
