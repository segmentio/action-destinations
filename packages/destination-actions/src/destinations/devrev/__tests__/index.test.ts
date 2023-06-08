import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('DevRev', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.devrev.ai').get('*').reply(200, {})

      // This should match your authentication.fields
      const authData = { apiKey: 'dummy-key' }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
