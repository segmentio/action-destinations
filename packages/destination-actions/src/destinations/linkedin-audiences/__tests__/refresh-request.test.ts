import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { BASE_URL } from '../constants'

/**
 * STRATCONN-6544. extendRequest adds `Authorization: Bearer <access token>` to every request, and core builds the
 * refresh request client from it with no token, so the refresh call went out with `Authorization: Bearer undefined`
 * (confirmed by capturing the real request). Against LinkedIn, the new token was then rejected on its first use for a
 * few seconds: 15/20 with that exact header vs 0/20 without it.
 */

const testDestination = createTestIntegration(Destination)

const event = createTestEvent({
  type: 'track',
  event: 'Audience Entered',
  properties: { audience_key: 'aud_1' },
  context: { traits: { email: 'testing@testing.com' } }
})

// A new object each time, because a refresh writes the new token into the settings it is given.
const buildSettings = () => ({
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
})

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)

describe('LinkedIn Audiences: token refresh request (STRATCONN-6544)', () => {
  beforeEach(() => {
    nock.cleanAll()
    process.env.ACTIONS_LINKEDIN_AUDIENCES_CLIENT_ID = 'client-id'
    process.env.ACTIONS_LINKEDIN_AUDIENCES_CLIENT_SECRET = 'client-secret'
  })
  afterEach(() => {
    nock.cleanAll()
  })

  it('does not send an Authorization header on the refresh call', async () => {
    let refreshAuthorization: unknown = 'refresh not called'
    let refreshContentType: unknown
    const apiAuthorizations: unknown[] = []

    // One interceptor serves both API calls so the order is explicit: 401 (expired token), then 200 after the refresh.
    nock(`${BASE_URL}/dmpSegments`)
      .get(/.*/)
      .query(true)
      .times(2)
      .reply(function (this: nock.ReplyFnContext) {
        apiAuthorizations.push(first(this.req.headers['authorization']))
        return apiAuthorizations.length === 1
          ? [401, { code: 'EXPIRED_ACCESS_TOKEN', serviceErrorCode: 65602, status: 401 }]
          : [200, { elements: [] }]
      })
    nock('https://www.linkedin.com')
      .post('/oauth/v2/accessToken')
      .reply(function (this: nock.ReplyFnContext) {
        refreshAuthorization = first(this.req.headers['authorization'])
        refreshContentType = first(this.req.headers['content-type'])
        return [200, { access_token: 'new-access-token' }]
      })

    await testDestination.onEvent(event, buildSettings()).catch(() => undefined)

    expect(refreshAuthorization).toBeUndefined()
    expect(refreshContentType).toBe('application/x-www-form-urlencoded')
    // Normal API calls are unchanged: the first carries the stored token, the retry carries the refreshed one.
    expect(apiAuthorizations).toEqual(['Bearer expired-access-token', 'Bearer new-access-token'])
  })
})
