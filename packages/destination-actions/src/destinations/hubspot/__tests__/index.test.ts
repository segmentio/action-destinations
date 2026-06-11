import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { HUBSPOT_BASE_URL } from '../properties'

const testDestination = createTestIntegration(Definition)

const oauthData = {
  refreshToken: 'refresh-token',
  accessToken: 'access-token',
  clientId: 'client-id',
  clientSecret: 'client-secret'
}

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
    it('should use v1 endpoint when feature flag is not set', async () => {
      nock(HUBSPOT_BASE_URL)
        .post('/oauth/v1/token')
        .reply(200, { access_token: 'new-access-token' })

      const result = await testDestination.refreshAccessToken({}, oauthData)
      expect(result).toEqual({ accessToken: 'new-access-token' })
    })

    it('should use v1 endpoint when feature flag is false', async () => {
      nock(HUBSPOT_BASE_URL)
        .post('/oauth/v1/token')
        .reply(200, { access_token: 'new-access-token' })

      const result = await testDestination.refreshAccessToken({}, oauthData, undefined, {
        'actions-hubspot-oauth-v2': false
      })
      expect(result).toEqual({ accessToken: 'new-access-token' })
    })

    it('should use 2026-03 endpoint when feature flag is enabled', async () => {
      nock(HUBSPOT_BASE_URL)
        .post('/oauth/2026-03/token')
        .reply(200, { access_token: 'new-access-token-v2' })

      const result = await testDestination.refreshAccessToken({}, oauthData, undefined, {
        'actions-hubspot-oauth-v2': true
      })
      expect(result).toEqual({ accessToken: 'new-access-token-v2' })
    })
  })
})
