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

    it('fails jsonContains on a different value, a missing key or a different array length', () => {
      const observation = { exchanges: [exchange(200, { result: { count: 2, ids: ['a', 'b'] } })] }
      const passes = (jsonContains: unknown) => validate({ status: 'success', jsonContains }, observation).passed

      expect(passes({ result: { count: 2 } })).toBe(true)
      expect(passes({ result: { count: 3 } })).toBe(false)
      expect(passes({ result: { missing: 2 } })).toBe(false)
      expect(passes({ result: { ids: ['a'] } })).toBe(false)
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

    it('fails when the partner returned a different status, including a 2xx', () => {
      expect(validate({ status: 'failure', httpStatus: 401 }, { exchanges: [exchange(403)] })).toEqual({
        passed: false,
        reason: 'expected partner status 401, got 403'
      })
      expect(validate({ status: 'failure', httpStatus: 401 }, { exchanges: [exchange(200)] }).passed).toBe(false)
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

    it('judges batch modes by the multistatus items, which must all carry the error', () => {
      const item = {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "missing the required field 'event'"
      }
      expect(validate(expectation, { exchanges: [], multistatus: [item, item] })).toEqual({ passed: true })
      expect(validate(expectation, { exchanges: [], multistatus: [item, { status: 200 }] }).passed).toBe(false)
      expect(validate(expectation, { exchanges: [], multistatus: [] }).passed).toBe(false)
    })

    it('fails on a different status or message', () => {
      const error = { type: 'PAYLOAD_VALIDATION_FAILED', message: "missing the required field 'event'", status: 400 }
      expect(validate(expectation, { exchanges: [], error: { ...error, status: 500 } }).passed).toBe(false)
      expect(validate(expectation, { exchanges: [], error: { ...error, message: 'something else' } }).passed).toBe(
        false
      )
    })
  })

  describe('multistatus', () => {
    const rejected = {
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'One of "external_id" is required.',
      errorreporter: 'INTEGRATIONS'
    }
    const observation = { exchanges: [exchange(201)], multistatus: [{ status: 200 }, rejected] }
    const expectation = {
      status: 'multistatus' as const,
      items: [
        { status: '2xx' as const },
        {
          status: 400 as const,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'external_id',
          errorreporter: 'INTEGRATIONS' as const
        }
      ]
    }

    it('passes when every event matches its item', () => {
      expect(validate(expectation, observation)).toEqual({ passed: true })
    })

    it('fails on a different count, status, type, message or reporter', () => {
      const withItem = (item: Record<string, unknown>) => ({ ...observation, multistatus: [{ status: 200 }, item] })
      expect(validate(expectation, { ...observation, multistatus: [{ status: 200 }] }).reason).toBe(
        'expected 2 per-event result(s), got 1'
      )
      expect(validate(expectation, withItem({ ...rejected, status: 422 })).reason).toMatch(
        /^event 1: expected status 400/
      )
      expect(validate(expectation, withItem({ ...rejected, errortype: 'BAD_REQUEST' })).reason).toMatch(
        /^event 1: expected error type PAYLOAD_VALIDATION_FAILED, got BAD_REQUEST/
      )
      expect(validate(expectation, withItem({ ...rejected, errormessage: 'other' })).reason).toMatch(
        /^event 1: error message does not contain "external_id"/
      )
      expect(validate(expectation, withItem({ ...rejected, errorreporter: 'DESTINATION' })).reason).toBe(
        'event 1: expected error reporter INTEGRATIONS, got DESTINATION'
      )
      expect(
        validate(expectation, { ...observation, multistatus: [{ status: 500, errortype: 'INTERNAL' }, rejected] })
          .reason
      ).toBe('event 0: expected 2xx, got 500 INTERNAL')
    })

    it('fails when the batch threw or returned no per-event results', () => {
      const error = { type: '401', message: 'Unauthorized', status: 401 }
      expect(validate(expectation, { exchanges: [exchange(401)], error }).reason).toBe(
        'expected per-event results, got 401 (401): Unauthorized'
      )
      expect(validate(expectation, { exchanges: [] }).reason).toBe(
        'expected per-event results, but the batch returned none'
      )
    })
  })

  describe('batch rules', () => {
    const batch = { exchanges: [exchange(200)], multistatus: [{ status: 200 }, { status: 200 }] }

    it('needs one result per event in batch modes', () => {
      expect(validate({ status: 'success' }, batch, { mode: 'batch', eventCount: 3 }).reason).toBe(
        'expected one result per event (3), got 2'
      )
      expect(validate({ status: 'success' }, batch, { mode: 'batch', eventCount: 2 }).passed).toBe(true)
    })

    it('fails batchWithMultistatus when performBatch returned a plain response', () => {
      const context = { mode: 'batchWithMultistatus' as const, eventCount: 2 }
      expect(validate({ status: 'success' }, { ...batch, returnedMultiStatus: false }, context).reason).toBe(
        'performBatch did not return a MultiStatusResponse, so per-event results only copy one response'
      )
      expect(validate({ status: 'success' }, { ...batch, returnedMultiStatus: true }, context).passed).toBe(true)
      // Unknown (performBatch threw or never ran, or the adapter can't see it): the rule does not apply.
      expect(validate({ status: 'success' }, batch, context).passed).toBe(true)
      // A plain batch may return either.
      const plain = { mode: 'batch' as const, eventCount: 2 }
      expect(validate({ status: 'success' }, { ...batch, returnedMultiStatus: false }, plain).passed).toBe(true)
    })
  })

  describe('response checks', () => {
    const at = (method: string, url: string, status: number, body: unknown = {}) => ({ method, url, status, body })
    const oauthRetry = {
      exchanges: [
        at('POST', 'https://api.fake.test/v1/contacts', 401, { message: 'expired' }),
        at('POST', 'https://api.fake.test/v1/contacts', 200, { id: 'c1' })
      ]
    }

    it('judges the last exchange matching method and URL', () => {
      const observation = {
        exchanges: [
          at('POST', 'https://api.fake.test/v1/contacts', 201, { id: 'c1' }),
          at('GET', 'https://api.fake.test/v1/contacts/c1', 404, { message: 'not found' })
        ]
      }
      expect(validate({ status: 'success' }, observation).reason).toBe('expected partner status 2xx, got 404')
      const contacts = { method: 'post', url: '/v1/contacts' }
      expect(validate({ status: 'success', exchange: contacts, jsonContains: { id: 'c1' } }, observation).passed).toBe(
        true
      )
      expect(validate({ status: 'failure', httpStatus: 404, exchange: { method: 'GET' } }, observation).passed).toBe(
        true
      )
      expect(validate({ status: 'success', exchange: { url: '/v2/' } }, observation).reason).toBe(
        'no partner request matched {"url":"/v2/"}; sent POST https://api.fake.test/v1/contacts, GET https://api.fake.test/v1/contacts/c1'
      )
    })

    it('asserts the exchange count', () => {
      expect(validate({ status: 'success', exchangeCount: 2 }, oauthRetry).passed).toBe(true)
      expect(validate({ status: 'success', exchangeCount: 1 }, oauthRetry).reason).toBe(
        'expected 1 partner request(s), got 2: POST https://api.fake.test/v1/contacts 401, POST https://api.fake.test/v1/contacts 200'
      )
      expect(validate({ status: 'failure', httpStatus: 401, exchangeCount: 1 }, oauthRetry).passed).toBe(false)
    })

    it('compares the whole trimmed body with bodyEquals, on success and failure', () => {
      const text = { exchanges: [exchange(200, '  OK\n')] }
      expect(validate({ status: 'success', bodyEquals: 'OK' }, text).passed).toBe(true)
      expect(validate({ status: 'success', bodyEquals: 'O' }, text).reason).toMatch(/^response body does not equal/)
      const json = { exchanges: [exchange(400, { error: 'bad' })] }
      expect(validate({ status: 'failure', httpStatus: 400, bodyEquals: '{"error":"bad"}' }, json).passed).toBe(true)
      expect(validate({ status: 'failure', httpStatus: 400, bodyEquals: '{}' }, json).passed).toBe(false)
    })

    it("requires a key to be missing with '$absent'", () => {
      const observation = { exchanges: [exchange(200, { ok: true, result: { errors: undefined, warnings: [] } })] }
      const passes = (jsonContains: unknown) => validate({ status: 'success', jsonContains }, observation).passed
      expect(passes({ error: '$absent', result: { errors: '$absent' } })).toBe(true)
      expect(passes({ ok: '$absent' })).toBe(false)
      expect(passes({ result: { warnings: '$absent' } })).toBe(false)
    })

    it('names a failed OAuth refresh', () => {
      const observation = {
        exchanges: [at('POST', 'https://api.fake.test/v1/contacts', 401)],
        error: { type: 'OAUTH_REFRESH_FAILED', message: 'Failed to refresh access token', status: 401 }
      }
      expect(validate({ status: 'success' }, observation).reason).toBe(
        'expected success, got OAuth refresh failed: re-authorize the sandbox app or check refreshAccessToken. ' +
          'OAUTH_REFRESH_FAILED (401): Failed to refresh access token'
      )
      // A fixture that expects the refresh to fail still can.
      expect(
        validate({ status: 'error', errorType: 'OAUTH_REFRESH_FAILED' }, { ...observation, exchanges: [] }).passed
      ).toBe(true)
    })
  })
})
