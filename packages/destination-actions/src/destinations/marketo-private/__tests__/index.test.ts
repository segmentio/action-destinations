import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const settings = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
  api_endpoint: 'https://123-ABC-456.mktorest.com'
}

describe('Marketo Private', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(settings.api_endpoint)
        .post('/identity/oauth/token')
        .reply(200, { access_token: 'token', token_type: 'bearer', expires_in: 3599, scope: 'scope' })

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should fail when credentials are invalid', async () => {
      nock(settings.api_endpoint).post('/identity/oauth/token').reply(401, {
        error: 'invalid_client',
        error_description: 'Bad client credentials'
      })

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })
})
