import { getOrRetry } from '../getOrRetry'

describe('getRetryable', () => {
  test("does proper amount of retries and fails if it didn't succeed", async () => {
    let actualAttempts = 0
    const retriableAction = () => {
      actualAttempts++
      throw new Error('some error')
    }

    const result = await getOrRetry(retriableAction, {
      attempts: 3,
      retryIntervalMs: 1
    })
    expect(actualAttempts).toBe(3)
    expect(result.error).toBeDefined()
  })

  test('does proper amount of retries and return value if succeed', async () => {
    let actualAttempts = 0
    const retriableAction = () => {
      actualAttempts++
      if (actualAttempts <= 2) throw new Error('some error')
      return 123
    }

    const result = await getOrRetry(retriableAction, {
      attempts: 3,
      retryIntervalMs: 1
    })
    expect(actualAttempts).toBe(3)
    expect(result.value).toBe(123)
  })
})
