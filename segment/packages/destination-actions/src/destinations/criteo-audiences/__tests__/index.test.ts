import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

const VALID_SETTINGS = {
  client_id: "client_id",
  client_secret: "client_secret",
  advertiser_id: "1234"
}

const MOCK_TOKEN_RESPONSE = {
  "access_token": "token",
  "token_type": "Bearer",
  "refresh_token": null,
  "expires_in": 900
}

describe('testAuthentication', () => {
  it('should validate valid auth token', async () => {
    nock('https://api.criteo.com').post('/oauth2/token').reply(200, MOCK_TOKEN_RESPONSE);
    const settings = VALID_SETTINGS;
    await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
  })

  it('should test that authentication fails', async () => {
    nock('https://api.criteo.com').post('/oauth2/token').reply(401)
    const settings = VALID_SETTINGS;
    await expect(testDestination.testAuthentication(settings)).rejects.toThrowError("")
  })
})
