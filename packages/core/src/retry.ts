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
