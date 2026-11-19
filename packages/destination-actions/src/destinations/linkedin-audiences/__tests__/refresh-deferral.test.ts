import nock from 'nock'
import {
  createTestEvent,
  createTestIntegration,
  InvalidAuthenticationError,
  RetryableError
} from '@segment/actions-core'
import Destination from '../index'
import { BASE_URL, FLAGON_DEFER_RETRY_NAME } from '../constants'

/**
 * STRATCONN-6544. LinkedIn sometimes answers 401 to a call made within a second of issuing the access token. Observed in
 * production as: GET dmpSegments -> 401 EXPIRED_ACCESS_TOKEN (65602), token refresh -> 200, same GET with the new token
 * -> 401 AUTHENTICATION_FAILED. With the flag on, the event must be failed for Segment to retry after a backoff instead
 * of being retried in-process.
 */

const testDestination = createTestIntegration(Destination)
type OnEventOptions = NonNullable<Parameters<typeof testDestination.onEvent>[2]>

const event = createTestEvent({
  type: 'track',
  event: 'Audience Entered',
  properties: { audience_key: 'aud_1' },
  context: { traits: { email: 'testing@testing.com' } }
})

const settingsWithToken = {
  ad_account_id: '123',
  send_email: true,
  send_google_advertising_id: false,
  oauth: { access_token: 'expired-access-token', refresh_token: 'refresh-token' },
  subscription: {
    subscribe: 'type = "track"',
    partnerAction: 'updateAudience',
    mapping: {
      personas_audience_key: 'aud_1',
      source_segment_id: 'aud_1',
      dmp_segment_name: 'aud_1',
      email: { '@path': '$.context.traits.email' },
      enable_batching: false
    }
  }
}

const EXPIRED = {
  code: 'EXPIRED_ACCESS_TOKEN',
  message: 'The token used in the request has expired',
  serviceErrorCode: 65602,
  status: 401
}
const AUTH_FAILED = { code: 'AUTHENTICATION_FAILED', message: 'Could not authenticate', status: 401 }

function makeOptions(opts: { flag: boolean; requestContext?: Record<string, string> }) {
  const responseContext: Record<string, { value: string; ttl: unknown }> = {}
  const onTokenRefresh = jest.fn(async (_tokens: { accessToken: string }) => {
    /* records the saved token */
  })
  const stateContext = {
    getRequestContext: (key: string) => opts.requestContext?.[key],
    setResponseContext: jest.fn((key: string, value: string, ttl: unknown) => {
      responseContext[key] = { value, ttl }
    })
  }
  return {
    options: {
      features: opts.flag ? { [FLAGON_DEFER_RETRY_NAME]: true } : {},
      onTokenRefresh,
      stateContext
    } as unknown as OnEventOptions,
    onTokenRefresh,
    stateContext,
    responseContext
  }
}

const dmpGet = () => nock(`${BASE_URL}/dmpSegments`).get(/.*/).query(true)
const tokenEndpoint = () => nock('https://www.linkedin.com').post('/oauth/v2/accessToken')

describe('LinkedIn Audiences: retry after token refresh (STRATCONN-6544)', () => {
  beforeEach(() => {
    nock.cleanAll()
    process.env.ACTIONS_LINKEDIN_AUDIENCES_CLIENT_ID = 'client-id'
    process.env.ACTIONS_LINKEDIN_AUDIENCES_CLIENT_SECRET = 'client-secret'
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('flag on', () => {
    it('refreshes once, saves the token, and defers the retry without calling LinkedIn again', async () => {
      const firstGet = dmpGet().reply(401, EXPIRED)
      const refresh = tokenEndpoint().reply(200, { access_token: 'new-access-token' })
      // Would be hit by an in-process retry with the fresh token (the prod failure). It must never be reached.
      const retriedGet = dmpGet().reply(401, AUTH_FAILED)
      const { options, onTokenRefresh, responseContext } = makeOptions({ flag: true })

      const err = await testDestination.onEvent(event, settingsWithToken, options).catch((e: unknown) => e)

      expect(err).toBeInstanceOf(RetryableError)
      expect((err as RetryableError).status).toBe(503)
      expect(firstGet.isDone()).toBe(true)
      expect(refresh.isDone()).toBe(true)
      expect(retriedGet.isDone()).toBe(false)
      expect(onTokenRefresh).toHaveBeenCalledTimes(1)
      expect(onTokenRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'new-access-token' }))
      expect(responseContext['token_refresh_deferrals']).toEqual({ value: '1', ttl: { minute: 15 } })
    })

    it.each([
      ['EXPIRED_ACCESS_TOKEN (65602)', EXPIRED],
      ['AUTHENTICATION_FAILED (no service code)', AUTH_FAILED],
      ['REVOKED_ACCESS_TOKEN (65601)', { code: 'REVOKED_ACCESS_TOKEN', serviceErrorCode: 65601, status: 401 }]
    ])('defers on a 401 with %s', async (_name, body) => {
      dmpGet().reply(401, body)
      tokenEndpoint().reply(200, { access_token: 'new-access-token' })
      const { options } = makeOptions({ flag: true })

      await expect(testDestination.onEvent(event, settingsWithToken, options)).rejects.toBeInstanceOf(RetryableError)
    })

    it('defers for a batch as well as a single event', async () => {
      dmpGet().reply(401, EXPIRED)
      tokenEndpoint().reply(200, { access_token: 'new-access-token' })
      const { options, responseContext } = makeOptions({ flag: true })
      const batchSettings = {
        ...settingsWithToken,
        subscription: {
          ...settingsWithToken.subscription,
          mapping: { ...settingsWithToken.subscription.mapping, enable_batching: true }
        }
      }

      await expect(testDestination.onBatch([event], batchSettings, options)).rejects.toBeInstanceOf(RetryableError)
      expect(responseContext['token_refresh_deferrals'].value).toBe('1')
    })

    it('does not defer on a non-401 error from LinkedIn', async () => {
      dmpGet().reply(500, { message: 'Internal error' })
      const refresh = tokenEndpoint().reply(200, { access_token: 'new-access-token' })
      const { options, onTokenRefresh } = makeOptions({ flag: true })

      const err = await testDestination.onEvent(event, settingsWithToken, options).catch((e: unknown) => e)

      expect(err).not.toBeInstanceOf(InvalidAuthenticationError)
      expect(refresh.isDone()).toBe(false)
      expect(onTokenRefresh).not.toHaveBeenCalled()
    })

    it('adds to the deferrals already counted for this instance', async () => {
      dmpGet().reply(401, AUTH_FAILED)
      tokenEndpoint().reply(200, { access_token: 'new-access-token' })
      const { options, responseContext } = makeOptions({ flag: true, requestContext: { token_refresh_deferrals: '2' } })

      await expect(testDestination.onEvent(event, settingsWithToken, options)).rejects.toBeInstanceOf(RetryableError)
      expect(responseContext['token_refresh_deferrals'].value).toBe('3')
    })

    it('after 3 deferrals, falls back to refreshing and retrying in-process, and delivers the event', async () => {
      dmpGet().reply(401, AUTH_FAILED)
      const refresh = tokenEndpoint().reply(200, { access_token: 'new-access-token' })
      dmpGet().reply(200, { elements: [{ id: 'dmp_segment_id' }] })
      const users = nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/).reply(200)
      const { options, onTokenRefresh, stateContext } = makeOptions({
        flag: true,
        requestContext: { token_refresh_deferrals: '3' }
      })

      await expect(testDestination.onEvent(event, settingsWithToken, options)).resolves.not.toThrow()
      expect(refresh.isDone()).toBe(true)
      expect(users.isDone()).toBe(true)
      expect(onTokenRefresh).toHaveBeenCalledTimes(1)
      expect(stateContext.setResponseContext).not.toHaveBeenCalledWith(
        'token_refresh_deferrals',
        expect.anything(),
        expect.anything()
      )
    })

    it('surfaces the refresh error, and does not defer, when the refresh token is invalid', async () => {
      dmpGet().reply(401, EXPIRED)
      tokenEndpoint().reply(400, {
        error: 'invalid_grant',
        error_description: 'The provided authorization grant or refresh token is invalid, expired or revoked.'
      })
      const { options, onTokenRefresh, stateContext } = makeOptions({ flag: true })

      const err = await testDestination.onEvent(event, settingsWithToken, options).catch((e: unknown) => e)

      expect(err).not.toBeInstanceOf(RetryableError)
      expect((err as Error).message).toContain('Your refresh token is invalid or expired')
      expect(onTokenRefresh).not.toHaveBeenCalled()
      expect(stateContext.setResponseContext).not.toHaveBeenCalled()
    })
  })

  describe('flag off (existing behaviour)', () => {
    it('refreshes and retries the call in-process', async () => {
      dmpGet().reply(401, EXPIRED)
      const refresh = tokenEndpoint().reply(200, { access_token: 'new-access-token' })
      dmpGet().reply(200, { elements: [{ id: 'dmp_segment_id' }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/).reply(200)
      const { options, onTokenRefresh, stateContext } = makeOptions({ flag: false })

      await expect(testDestination.onEvent(event, settingsWithToken, options)).resolves.not.toThrow()
      expect(refresh.isDone()).toBe(true)
      expect(onTokenRefresh).toHaveBeenCalledTimes(1)
      // The action caches the DMP segment id in the state context; the deferral counter must not be written.
      expect(stateContext.setResponseContext).not.toHaveBeenCalledWith(
        'token_refresh_deferrals',
        expect.anything(),
        expect.anything()
      )
    })
  })
})
