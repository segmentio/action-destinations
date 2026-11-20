import nock from 'nock'
import { createTestEvent, createTestIntegration, RetryableError } from '@segment/actions-core'
import Destination from '../index'
import { BASE_URL, FLAGON_DEFER_RETRY_NAME } from '../constants'

/**
 * STRATCONN-6544. After a token refresh, LinkedIn can reject the new token for a few seconds, which is where core's
 * immediate in-process retry lands. With the flag on, a 401 refreshes the token and fails the event (or the whole
 * batch) with a retryable 503 so that Segment retries it after a backoff.
 *
 * Batches matter most here: batching is on by default and hidden, and the batch code reports a 401 on every item of
 * a multistatus response instead of throwing.
 */

const testDestination = createTestIntegration(Destination)
type OnEventOptions = NonNullable<Parameters<typeof testDestination.onEvent>[2]>

const CONVERSION_RULE_ID = 789123

const conversion = (email: string) =>
  createTestEvent({
    type: 'track',
    event: 'Order Completed',
    timestamp: String(Date.now()),
    context: { traits: { email } },
    properties: { revenue: 23, currency: 'USD' }
  })

const settings = (batching: boolean) => ({
  oauth: { access_token: 'expired-access-token', refresh_token: 'refresh-token' },
  subscription: {
    subscribe: 'type = "track"',
    partnerAction: 'streamConversion',
    mapping: {
      email: { '@path': '$.context.traits.email' },
      conversionHappenedAt: { '@path': '$.timestamp' },
      onMappingSave: { inputs: {}, outputs: { id: CONVERSION_RULE_ID } },
      enable_batching: batching
    }
  }
})

const EXPIRED = {
  status: 401,
  serviceErrorCode: 65602,
  code: 'EXPIRED_ACCESS_TOKEN',
  message: 'The token used in the request has expired'
}

function makeOptions(opts: { features?: Record<string, boolean>; requestContext?: Record<string, string> }) {
  const written: Record<string, { value: string; ttl: unknown }> = {}
  const onTokenRefresh = jest.fn(async (_tokens: { accessToken: string }) => undefined)
  const stateContext = {
    getRequestContext: (key: string) => opts.requestContext?.[key],
    setResponseContext: jest.fn((key: string, value: string, ttl: unknown) => {
      written[key] = { value, ttl }
    })
  }
  return {
    options: { features: opts.features ?? {}, onTokenRefresh, stateContext } as unknown as OnEventOptions,
    onTokenRefresh,
    written
  }
}
const flagOn = { [FLAGON_DEFER_RETRY_NAME]: true }

/** Mocks LinkedIn's conversionEvents endpoint, answering 401 to the expired token and 2xx to the refreshed one. */
function mockConversionEvents(bodies: { elements?: unknown[] }[] = []) {
  const tokensSeen: string[] = []
  nock(BASE_URL)
    .post('/conversionEvents')
    .times(3)
    .reply(function (this: nock.ReplyFnContext, _uri, body) {
      const authorization = String(this.req.headers['authorization'])
      tokensSeen.push(authorization)
      bodies.push(body as { elements?: unknown[] })
      return authorization === 'Bearer expired-access-token' ? [401, EXPIRED] : [201, {}]
    })
  return tokensSeen
}
const mockRefresh = () =>
  nock('https://www.linkedin.com').post('/oauth/v2/accessToken').reply(200, { access_token: 'new-access-token' })

const statuses = (response: unknown) =>
  (response as { multistatus: { status: number }[] }[])[0].multistatus.map((item) => item.status)

describe('LinkedIn Conversions: retry after token refresh (STRATCONN-6544)', () => {
  beforeEach(() => {
    nock.cleanAll()
    process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_ID = 'client-id'
    process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_SECRET = 'client-secret'
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('flag on', () => {
    it('batch rejected with 401: refreshes once, saves the token, fails the batch with 503, sends nothing again', async () => {
      const tokensSeen = mockConversionEvents()
      const refresh = mockRefresh()
      const { options, onTokenRefresh, written } = makeOptions({ features: flagOn })

      const err = await testDestination
        .onBatch([conversion('one@example.com'), conversion('two@example.com')], settings(true), options)
        .catch((e: unknown) => e)

      expect(err).toBeInstanceOf(RetryableError)
      expect((err as RetryableError).status).toBe(503)
      expect(tokensSeen).toEqual(['Bearer expired-access-token'])
      expect(refresh.isDone()).toBe(true)
      expect(onTokenRefresh).toHaveBeenCalledTimes(1)
      expect(onTokenRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'new-access-token' }))
      expect(written['token_refresh_deferrals']).toEqual({ value: '1', ttl: { minute: 15 } })
    })

    it('batch with an invalid item next to the 401s still defers, since LinkedIn accepted nothing', async () => {
      const bodies: { elements?: unknown[] }[] = []
      const tokensSeen = mockConversionEvents(bodies)
      mockRefresh()
      const { options, written } = makeOptions({ features: flagOn })
      // No user identifier: rejected by validation before the request, reported as a 400 on its item.
      const invalid = createTestEvent({
        type: 'track',
        timestamp: String(Date.now()),
        context: { traits: {} },
        properties: {}
      })

      await expect(
        testDestination.onBatch([conversion('one@example.com'), invalid], settings(true), options)
      ).rejects.toBeInstanceOf(RetryableError)
      expect(tokensSeen).toEqual(['Bearer expired-access-token'])
      // Only the valid conversion reached LinkedIn, so the batch really mixed a 400 with the 401.
      expect(bodies[0].elements).toHaveLength(1)
      expect(written['token_refresh_deferrals'].value).toBe('1')
    })

    it('single event rejected with 401: refreshes once and fails with 503 without calling LinkedIn again', async () => {
      const tokensSeen = mockConversionEvents()
      mockRefresh()
      const { options, written } = makeOptions({ features: flagOn })

      const err = await testDestination
        .onEvent(conversion('one@example.com'), settings(false), options)
        .catch((e: unknown) => e)

      expect(err).toBeInstanceOf(RetryableError)
      expect(tokensSeen).toEqual(['Bearer expired-access-token'])
      expect(written['token_refresh_deferrals'].value).toBe('1')
    })

    it('after 3 deferrals, falls back to the in-process retry and delivers the batch', async () => {
      const tokensSeen = mockConversionEvents()
      mockRefresh()
      const { options, written } = makeOptions({
        features: flagOn,
        requestContext: { token_refresh_deferrals: '3' }
      })

      const response = await testDestination.onBatch([conversion('one@example.com')], settings(true), options)

      expect(tokensSeen).toEqual(['Bearer expired-access-token', 'Bearer new-access-token'])
      expect(statuses(response)).toEqual([201])
      expect(written).toEqual({})
    })

    it('does not refresh or defer on a non-401 error from LinkedIn', async () => {
      nock(BASE_URL).post('/conversionEvents').reply(500, { status: 500, message: 'Internal error' })
      const refresh = mockRefresh()
      const { options, onTokenRefresh, written } = makeOptions({ features: flagOn })

      const response = await testDestination.onBatch([conversion('one@example.com')], settings(true), options)

      expect(statuses(response)).toEqual([500])
      expect(refresh.isDone()).toBe(false)
      expect(onTokenRefresh).not.toHaveBeenCalled()
      expect(written).toEqual({})
    })

    it('surfaces an invalid refresh token as it is, without deferring or counting', async () => {
      mockConversionEvents()
      nock('https://www.linkedin.com')
        .post('/oauth/v2/accessToken')
        .times(2)
        .reply(400, { error: 'invalid_grant', error_description: 'The refresh token is invalid or expired.' })
      const { options, onTokenRefresh, written } = makeOptions({ features: flagOn })

      const err = await testDestination
        .onBatch([conversion('one@example.com')], settings(true), options)
        .catch((e: unknown) => e)

      expect(err).not.toBeInstanceOf(RetryableError)
      expect((err as Error).message).toContain('Your refresh token is invalid or expired')
      expect(onTokenRefresh).not.toHaveBeenCalled()
      expect(written).toEqual({})
    })
  })

  describe('flag off (existing behaviour)', () => {
    it.each([
      ['no flags', {}],
      // Each LinkedIn destination has its own flag, so turning one on must not change the other.
      ['only the LinkedIn Audiences flag', { 'linkedin-audiences-defer-retry-after-refresh': true }]
    ])('with %s, refreshes and resends the batch in-process', async (_name, features) => {
      const tokensSeen = mockConversionEvents()
      const refresh = mockRefresh()
      const { options, onTokenRefresh, written } = makeOptions({ features })

      const response = await testDestination.onBatch([conversion('one@example.com')], settings(true), options)

      expect(tokensSeen).toEqual(['Bearer expired-access-token', 'Bearer new-access-token'])
      expect(statuses(response)).toEqual([201])
      expect(refresh.isDone()).toBe(true)
      expect(onTokenRefresh).toHaveBeenCalledTimes(1)
      expect(written).toEqual({})
    })
  })
})
