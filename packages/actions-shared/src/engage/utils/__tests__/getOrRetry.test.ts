import { getOrRetry } from '../getOrRetry'

describe('getRetryable', () => {
  test.only("does proper amount of retries and fails if it didn't succeed", async () => {
    let actualAttempts = 0
    const retriableAction = () => {
      actualAttempts++
      throw new Error('some error')
    }

    const result = await getOrRetry(retriableAction, {
      retryAttempts: 3,
      retryIntervalMs: 1
    })
    expect(actualAttempts).toBe(4)
    expect(result.error).toBeDefined()
  })

  test.only('does proper amount of retries and return value if succeed', async () => {
    let actualAttempts = 0
    const retriableAction = () => {
      actualAttempts++
      if (actualAttempts <= 2) throw new Error('some error')
      return 123
    }

    const result = await getOrRetry(retriableAction, {
      retryAttempts: 3,
      retryIntervalMs: 1
    })
    expect(actualAttempts).toBe(3)
    expect(result.value).toBe(123)
  })
})
