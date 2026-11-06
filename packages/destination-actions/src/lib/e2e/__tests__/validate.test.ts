import { validate } from '../validate'

const exchange = (status: number, body: unknown = {}) => ({ method: 'POST', url: 'https://fake.test', status, body })

describe('validate', () => {
  describe('success', () => {
    it('passes a 2xx partner response', () => {
      expect(validate({ status: 'success' }, { exchanges: [exchange(200)] })).toEqual({ passed: true })
    })

    it('checks the body', () => {
      const observation = { exchanges: [exchange(200, { status: 'OK', num_records_imported: 2 })] }
      expect(validate({ status: 'success', jsonContains: { num_records_imported: 2 } }, observation).passed).toBe(true)
      expect(validate({ status: 'success', bodyContains: 'Rejected' }, observation).passed).toBe(false)
    })

    it('fails when any batch item failed', () => {
      const observation = {
        exchanges: [exchange(200)],
        multistatus: [{ status: 200 }, { status: 400, errortype: 'BAD_REQUEST' }]
      }
      expect(validate({ status: 'success' }, observation)).toEqual({
        passed: false,
        reason: '1 batch item(s) failed, first 400 BAD_REQUEST'
      })
    })

    it('fails when our code threw', () => {
      const observation = { exchanges: [], error: { type: 'PAYLOAD_VALIDATION_FAILED', message: 'nope', status: 400 } }
      expect(validate({ status: 'success' }, observation).passed).toBe(false)
    })
  })

  describe('failure', () => {
    it('passes when the partner returned the expected non-2xx', () => {
      const observation = {
        exchanges: [exchange(401, 'Unauthorized')],
        error: { type: '401', message: 'x', status: 401 }
      }
      expect(validate({ status: 'failure', httpStatus: 401, bodyContains: 'Unauthorized' }, observation).passed).toBe(
        true
      )
    })

    it('fails when no request was sent', () => {
      expect(validate({ status: 'failure', httpStatus: 401 }, { exchanges: [] }).passed).toBe(false)
    })
  })

  describe('error', () => {
    const expectation = {
      status: 'error' as const,
      errorType: 'PAYLOAD_VALIDATION_FAILED',
      httpStatus: 400,
      errorMessage: "missing the required field 'event'"
    }

    it('passes when our code threw the expected error before any request', () => {
      const error = {
        type: 'PAYLOAD_VALIDATION_FAILED',
        message: "The root value is missing the required field 'event'.",
        status: 400
      }
      expect(validate(expectation, { exchanges: [], error })).toEqual({ passed: true })
    })

    it('fails on a different error type, or when a request was sent', () => {
      const error = { type: 'RETRYABLE_ERROR', message: "missing the required field 'event'", status: 400 }
      expect(validate(expectation, { exchanges: [], error }).passed).toBe(false)
      expect(
        validate(expectation, { exchanges: [exchange(400)], error: { ...error, type: 'PAYLOAD_VALIDATION_FAILED' } })
          .passed
      ).toBe(false)
    })
  })
})
