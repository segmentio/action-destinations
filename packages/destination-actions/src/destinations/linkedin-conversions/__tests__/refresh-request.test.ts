import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

/**
 * STRATCONN-6544. extendRequest adds `Authorization: Bearer <access token>` to every request, and core builds the
 * refresh request client from it with no token, so the refresh call went out with `Authorization: Bearer undefined`.
 * Against LinkedIn, the new token was then rejected on its first use for a few seconds (measured with LinkedIn
 * Audiences, which shares this extendRequest shape: 15/20 with that exact header vs 0/20 without it).
 */

const testDestination = createTestIntegration(Destination)

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)

describe('LinkedIn Conversions: token refresh request (STRATCONN-6544)', () => {
  beforeEach(() => {
    nock.cleanAll()
    process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_ID = 'client-id'
    process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_SECRET = 'client-secret'
  })
  afterEach(() => {
    nock.cleanAll()
  })

  it('does not send an Authorization header on the refresh call', async () => {
    let refreshAuthorization: unknown = 'refresh not called'
    let refreshContentType: unknown
    let refreshBody = ''

    nock('https://www.linkedin.com')
      .post('/oauth/v2/accessToken')
      .reply(function (this: nock.ReplyFnContext, _uri, body) {
        refreshAuthorization = first(this.req.headers['authorization'])
        refreshContentType = first(this.req.headers['content-type'])
        refreshBody = String(body)
        return [200, { access_token: 'new-access-token' }]
      })

    // Core calls the refresh with settings that have no oauth block, which is what produced "Bearer undefined".
    const result = await testDestination.refreshAccessToken(
      {},
      { accessToken: 'expired-access-token', refreshToken: 'refresh-token', clientId: '', clientSecret: '' }
    )

    expect(result).toEqual({ accessToken: 'new-access-token' })
    expect(refreshAuthorization).toBeUndefined()
    expect(refreshContentType).toBe('application/x-www-form-urlencoded')
    expect(refreshBody).toContain('grant_type=refresh_token')
  })

  it('still sends the access token on normal API calls', async () => {
    let apiAuthorization: unknown
    nock('https://api.linkedin.com')
      .get('/rest/me')
      .reply(function (this: nock.ReplyFnContext) {
        apiAuthorization = first(this.req.headers['authorization'])
        return [200, { id: '1' }]
      })

    await testDestination.testAuthentication({ oauth: { access_token: 'live-access-token' } } as any)

    expect(apiAuthorization).toBe('Bearer live-access-token')
  })
})
