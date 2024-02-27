import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { enchargeRestAPIBase } from '../utils'

const testDestination = createTestIntegration(Definition)

describe('Encharge', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(enchargeRestAPIBase).get('/v1/accounts/info').reply(200, {})

      // This should match your authentication.fields
      const authData = {
        apiKey: 'test'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
