import { retry } from '@segment/actions-core'
import { delay } from './delay'
import { ValueOrError, getOrCatch } from './getOrCatch'

export async function getOrRetry<T>(
  action: (attempt: number) => PromiseLike<T> | T,
  args?: GetOrRetryArgs
): Promise<ValueOrError<T>> {
  const retryIntervalMs = args?.retryIntervalMs === undefined ? backoffRetryPolicy() : args?.retryIntervalMs ?? 1000
  return getOrCatch(
    async () =>
      await retry((attempt) => action(attempt), {
        retries: args?.attempts,
        async onFailedAttempt(error, attemptCount) {
          if (args?.onFailedAttempt) await args.onFailedAttempt(error, attemptCount)
          const intervalMs: number =
            typeof retryIntervalMs == 'function' ? retryIntervalMs(attemptCount, error) : retryIntervalMs
          if (intervalMs > 0) await delay(intervalMs)
        }
      })
  )
}

export type GetOrRetryArgs = {
  /**
   * The number of times to attempt the operation before giving up. The default is 2.
   */
  attempts?: number
  /**
   * The interval between retries in milliseconds. If a function is provided, it will be called with the attempt number and the error that occurred.
   */
  retryIntervalMs?: number | RetryIntervalMsPolicy
  /**
   * callback invoked when an attempt fails
   * @param error
   * @param attemptCount
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFailedAttempt?: (error: any, attemptCount: number) => PromiseLike<void> | void
}

/**
 * function that defines the interval between retries depending on the attempt number and the error that occurred
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RetryIntervalMsPolicy = (attempt: number, error: any) => number

export function backoffRetryPolicy(initialDelayMs = 500, multiplier = 1): RetryIntervalMsPolicy {
  return (attempt: number) => initialDelayMs * attempt * multiplier
}
