import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { endpoints } from '../util'

const testDestination = createTestIntegration(Definition)
const GAMEBALL_API_KEY = 'test_api_key'
const GAMEBALL_SECRET_KEY = 'test_secret_key'

describe('actions-gameball', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(endpoints.baseAuthUrl).post(endpoints.testAuthentication).reply(200, {})

      // This should match your authentication.fields
      const authData = {
        apiKey: GAMEBALL_API_KEY,
        secretKey: GAMEBALL_SECRET_KEY
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
