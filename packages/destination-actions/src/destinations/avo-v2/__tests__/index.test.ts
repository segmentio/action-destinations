import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Avo Inspector', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.avo.app').post('/auth/inspector/validate').reply(200, {})

      // This should match your authentication.fields
      const authData = {
        apiKey: 'test-api-key',
        env: 'dev'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
