/* eslint-disable @typescript-eslint/no-explicit-any */
// import { retry } from '@segment/actions-core/retry' // This import is not working, gives a runtime error: retry_1.retry is not a function
import { delay } from './delay'
import { ValueOrError, getOrCatch } from './getOrCatch'

export type RetryPolicy = (attempt: number, error: any) => number

export async function getOrRetry<T>(
  action: (attempt: number) => PromiseLike<T> | T,
  args?: RetryArgs
): Promise<ValueOrError<T>> {
  const retryIntervalMs = args?.retryIntervalMs === undefined ? backoffRetryPolicy() : args?.retryIntervalMs
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- good luck figuring out why typescript thinks it's unsafe
  return getOrCatch(
    async () =>
      await retry((attempt) => action(attempt), {
        retries: args?.attempts,
        async onFailedAttempt(error, attemptCount) {
          const intervalMs: number =
            typeof retryIntervalMs == 'function'
              ? retryIntervalMs(attemptCount, error)
              : typeof args?.attempts === 'number'
              ? (args?.retryIntervalMs as number)
              : 1000
          if (intervalMs > 0) await delay(intervalMs)
        }
      })
  )
}

export function backoffRetryPolicy(initialDelayMs = 500, multiplier = 1): RetryPolicy {
  return (attempt: number) => initialDelayMs * attempt * multiplier
}

export type RetryArgs = {
  attempts?: number
  retryIntervalMs?: number | RetryPolicy
}

/**
 * import { retry } from '@segment/actions-core/retry'
 * ^ This import is not working, gives a runtime error: retry_1.retry is not a function during jest tests,
 * so the following code is a copy of the original code from: @segment/actions-core/retry.
 * Once jest config is fixed to use the correct import, the following code should be removed.
 */

interface RetryOptions {
  retries?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFailedAttempt?: (error: any, attemptCount: number) => PromiseLike<void> | void
}

const DEFAULT_RETRY_ATTEMPTS = 2

export async function retry<T>(
  input: (attemptCount: number) => PromiseLike<T> | T,
  options?: RetryOptions
): Promise<T> {
  const retries = options?.retries ?? DEFAULT_RETRY_ATTEMPTS

  for (let attemptCount = 1; attemptCount <= retries; attemptCount++) {
    try {
      return await input(attemptCount)
    } catch (error) {
      if (options?.onFailedAttempt) {
        await options.onFailedAttempt(error, attemptCount)
      }

      // Let the final error bubble
      if (!error || attemptCount >= retries) {
        throw error
      }
    }
  }

  // Note: this is unreachable, but TS can't figure that out
  throw new Error('Exhausted all retries.')
}
