import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { baseUrl } from '../constants'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Trackey', () => {
  describe('testAuthentication', () => {
    it('should validate api key', async () => {
      nock(baseUrl).get('/auth/me').reply(200, {
        status: 'SUCCESS',
        data: 'Test client'
      })

      // This should match your authentication.fields
      const authData = {
        apiKey: 'test-api-key'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
