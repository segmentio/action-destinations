/* eslint-disable @typescript-eslint/no-explicit-any */
import { delay } from './delay'
import { ValueOrError, getOrCatch } from './getOrCatch'

export async function getOrRetry<T>(
  action: () => Promise<T>,
  args: {
    retryAttempts: number
    retryIntervalMs: number | ((attempt: number) => number)
    retryIf?: (valueOrError: ValueOrError<T>) => boolean
  }
): Promise<ValueOrError<T>>
export async function getOrRetry<T>(
  action: () => T,
  args: {
    retryAttempts: number
    retryIntervalMs: number | ((attempt: number) => number)
    retryIf?: (valueOrError: ValueOrError<T>) => boolean
  }
): Promise<ValueOrError<T>>
export async function getOrRetry(
  action: () => any,
  args: {
    retryAttempts: number
    retryIntervalMs: number | ((attempt: number) => number)
    retryIf?: (valueOrError: ValueOrError<any>) => boolean
  }
): Promise<ValueOrError<any>> {
  let retryAttempt = 0
  let valueOrError: ValueOrError<any> | undefined = undefined
  do {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    valueOrError = await getOrCatch(action)
    const shouldRetry = args.retryIf ? args.retryIf(valueOrError) : !!valueOrError.error

    if (!shouldRetry || retryAttempt >= args.retryAttempts) break

    retryAttempt++

    const retryIntervalMs =
      typeof args.retryIntervalMs === 'function' ? args.retryIntervalMs(retryAttempt) : args.retryIntervalMs
    await delay(retryIntervalMs)
    // eslint-disable-next-line no-constant-condition -- the loop is exited by break
  } while (true)

  return valueOrError
}
