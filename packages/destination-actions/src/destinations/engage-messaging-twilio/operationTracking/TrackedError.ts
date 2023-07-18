import { TryCatchFinallyContext } from './wrapTryCatchFinallyPromisable'

/**
 * Error object that contains tracked data
 */
export interface TrackedError<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> extends Error {
  /**
   * Underlying error that this error wraps
   */
  underlyingError?: unknown
  /**
   * Operation context during which the error happened
   */
  trackedContext?: TContext

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
