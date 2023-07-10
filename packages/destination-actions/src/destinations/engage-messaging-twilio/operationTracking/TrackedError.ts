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
  /**
   * Tags to add to the operation completion metrics
   */
  tags?: string[]

  [key: string]: any
}
