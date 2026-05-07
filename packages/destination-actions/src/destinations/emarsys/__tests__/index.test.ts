import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const AUTH_HOST = 'https://auth.example.com'
const AUTH_PATH = '/oauth/token'

describe('Emarsys', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(AUTH_HOST).post(AUTH_PATH).reply(200, { token_type: 'Bearer', access_token: 'test-token', expires_in: 3600 })

      const authData = {
        apiAuthEndpoint: `${AUTH_HOST}${AUTH_PATH}`,
        apiBaseUrl: 'https://api.example.com/api/',
        apiClientId: 'testclient',
        apiClientSecret: 'supersecret'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
