import { isRetryableStatus, RetryableError, RetryableStatusCodes } from '../errors'

// The statuses RetryableError accepts. isRetryableStatus must agree with this list exactly:
// it is the guard callers use to decide whether they may construct a RetryableError.
const RETRYABLE: RetryableStatusCodes[] = [
  408, 423, 429, 500, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 598, 599
]

describe('isRetryableStatus', () => {
  it.each(RETRYABLE)('treats %i as retryable', (status: number) => {
    expect(isRetryableStatus(status)).toBe(true)
  })

  it.each([
    [200, 'OK'],
    [201, 'Created'],
    [204, 'No Content'],
    [301, 'Moved Permanently'],
    [304, 'Not Modified'],
    [400, 'Bad Request'],
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
    [409, 'Conflict'],
    [413, 'Payload Too Large'],
    [422, 'Unprocessable Entity'],
    [451, 'Unavailable For Legal Reasons']
  ])('treats %i (%s) as not retryable', (status: number) => {
    expect(isRetryableStatus(status)).toBe(false)
  })

  // 501 sits inside the 5xx range but is not retryable: the server does not implement the
  // method, so repeating the request cannot succeed. A naive `status >= 500` check gets
  // this wrong, which is the mistake this helper exists to prevent.
  it.each([501, 512, 520, 597, 600])('treats %i as not retryable even though it is 5xx', (status: number) => {
    expect(isRetryableStatus(status)).toBe(false)
  })

  it.each([0, -1, -500, 1, 99, 1000, NaN, Infinity, -Infinity, 500.5, 429.1])(
    'treats %p as not retryable',
    (status: number) => {
      expect(isRetryableStatus(status)).toBe(false)
    }
  )

  it('accepts every status it reports as retryable when constructing a RetryableError', () => {
    for (const status of RETRYABLE) {
      const error = new RetryableError('transient', status)

      expect(error.status).toBe(status)
      expect(error.code).toBe('RETRYABLE_ERROR')
    }
  })

  it('reports every status RetryableError defaults to as retryable', () => {
    expect(isRetryableStatus(new RetryableError().status)).toBe(true)
  })

  // This one is checked by the compiler rather than at runtime. isRetryableStatus returns
  // `status is RetryableStatusCodes`, not boolean, so a caller holding a plain number can
  // narrow it and hand it to RetryableError. Weaken the signature to boolean and every other
  // test here still passes, but this file stops compiling, which fails the suite.
  it('is a type guard, so a plain number narrows to a status RetryableError accepts', () => {
    // Widened on purpose: written as `const status = 503` TypeScript infers the literal type
    // 503, which is already a RetryableStatusCodes, and the test would prove nothing.
    const status = 503 as number

    // Never runs, 503 is retryable. It is here only so status is narrowed below.
    if (!isRetryableStatus(status)) {
      throw new Error('unreachable: 503 is retryable')
    }

    // The assertion: this argument does not compile while status is still a number.
    const error = new RetryableError('transient', status)

    expect(error.status).toBe(503)
  })

  // The cases above are spot checks. This sweeps every status from 0 to 699 and asserts the
  // guard reports those and nothing else, which is what catches a code being added to the
  // list by mistake, or the implementation regressing to something like `status >= 500`.
  it('reports no status other than the ones on the list', () => {
    const everyStatus = Array.from({ length: 700 }, (_, status) => status)

    // Both sides are in ascending order already, so this compares them as they stand.
    expect(everyStatus.filter(isRetryableStatus)).toEqual(RETRYABLE)
  })
})
