import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { endpoints } from '../util'

const testDestination = createTestIntegration(Definition)

describe('actions-gameball', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(endpoints.baseAuthUrl).post(endpoints.testAuthentication).reply(200, {})

      // This should match your authentication.fields
      const authData = {
        apiKey: 'test_api_key'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
