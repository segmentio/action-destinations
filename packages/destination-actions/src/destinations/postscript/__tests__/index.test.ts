import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { PS_BASE_URL } from '../const'

const testDestination = createTestIntegration(Definition)

describe('Postscript', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(PS_BASE_URL).get('/api/v2/me').reply(200, {})
      const authData = {
        secret_key: 'test-secret'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock(PS_BASE_URL).get('/api/v2/me').reply(403, {})
      const authData = {
        secret_key: 'test-secret'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        new Error('Credentials are invalid: 403 Forbidden')
      )
    })
  })
})
