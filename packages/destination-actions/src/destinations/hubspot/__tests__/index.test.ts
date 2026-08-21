import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { HUBSPOT_BASE_URL } from '../properties'
import { HUBSPOT_OAUTH_API_VERSION } from '../versioning-info'

const testDestination = createTestIntegration(Definition)

describe('HubSpot Cloud Mode (Actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(HUBSPOT_BASE_URL).get('/crm/v3/objects/contacts?limit=1').reply(200, {})
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock(HUBSPOT_BASE_URL).get('/crm/v3/objects/contacts?limit=1').reply(401, {})
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        new Error('Credentials are invalid: 401 Unauthorized')
      )
    })
  })

  describe('refreshAccessToken', () => {
    const oauthData = {
      accessToken: 'stale-access-token',
      refreshToken: 'a-refresh-token',
      clientId: 'a-client-id',
      clientSecret: 'a-client-secret',
      refreshTokenUrl: ''
    }

    // HubSpot deprecates the v1 OAuth API on February 16, 2027. Pin the version and the
    // body-encoded credentials so a silent regression to /oauth/v1/token fails here.
    it('refreshes the access token against the versioned OAuth endpoint', async () => {
      let contentType = ''
      const scope = nock(HUBSPOT_BASE_URL)
        .post(`/oauth/${HUBSPOT_OAUTH_API_VERSION}/token`, (body) => {
          expect(body).toEqual({
            grant_type: 'refresh_token',
            refresh_token: oauthData.refreshToken,
            client_id: oauthData.clientId,
            client_secret: oauthData.clientSecret
          })
          return true
        })
        .reply(function () {
          contentType = String(this.req.headers['content-type'])
          return [200, { access_token: 'a-fresh-access-token' }]
        })

      const token = await testDestination.refreshAccessToken({} as never, oauthData)

      expect(token).toEqual({ accessToken: 'a-fresh-access-token' })
      expect(scope.isDone()).toBe(true)
      expect(contentType).toContain('application/x-www-form-urlencoded')
    })

    it('does not use the deprecated v1 OAuth endpoint', async () => {
      expect(HUBSPOT_OAUTH_API_VERSION).not.toBe('v1')
    })
  })
})
