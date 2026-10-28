import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { HUBSPOT_BASE_URL } from '../properties'

const testDestination = createTestIntegration(Definition)

describe('HubSpot Cloud Mode (Actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(HUBSPOT_BASE_URL).get('/crm/objects/2026-03/contacts?limit=1').reply(200, {})
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock(HUBSPOT_BASE_URL).get('/crm/objects/2026-03/contacts?limit=1').reply(401, {})
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        new Error('Credentials are invalid: 401 Unauthorized')
      )
    })
  })

  describe('refreshAccessToken', () => {
    const oauthData = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      clientId: 'client-id',
      clientSecret: 'client-secret'
    }

    const expectedBody = {
      refresh_token: 'refresh-token',
      client_id: 'client-id',
      client_secret: 'client-secret',
      grant_type: 'refresh_token'
    }

    it('refreshes the token against the date-based OAuth endpoint', async () => {
      const scope = nock(HUBSPOT_BASE_URL)
        .post('/oauth/2026-03/token', expectedBody)
        .reply(200, { access_token: 'new-access-token' })

      const result = await testDestination.refreshAccessToken({}, oauthData)

      expect(scope.isDone()).toBe(true)
      expect(result).toEqual({ accessToken: 'new-access-token' })
    })

    it('falls back to v1 when the date-based endpoint rejects the account', async () => {
      const dateBasedScope = nock(HUBSPOT_BASE_URL).post('/oauth/2026-03/token', expectedBody).reply(400, {})
      const legacyScope = nock(HUBSPOT_BASE_URL)
        .post('/oauth/v1/token', expectedBody)
        .reply(200, { access_token: 'legacy-access-token' })

      const result = await testDestination.refreshAccessToken({}, oauthData)

      expect(dateBasedScope.isDone()).toBe(true)
      expect(legacyScope.isDone()).toBe(true)
      expect(result).toEqual({ accessToken: 'legacy-access-token' })
    })

    it('surfaces the error when both endpoints reject the refresh token', async () => {
      nock(HUBSPOT_BASE_URL).post('/oauth/2026-03/token', expectedBody).reply(400, {})
      nock(HUBSPOT_BASE_URL).post('/oauth/v1/token', expectedBody).reply(400, {})

      await expect(testDestination.refreshAccessToken({}, oauthData)).rejects.toThrowError()
    })
  })
})
