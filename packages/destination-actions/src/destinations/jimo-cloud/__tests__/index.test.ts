import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { JIMO_BASE_URL, JIMO_TEST_PATH } from '../constants'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Jimo Cloud (actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication with valid API key', async () => {
      nock(JIMO_BASE_URL).get(JIMO_TEST_PATH).matchHeader('Authorization', 'Bearer test-api-key').reply(200, {})

      const authData = {
        apiKey: 'test-api-key'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
      expect(nock.isDone()).toBe(true)
    })

    it('should fail authentication with invalid API key', async () => {
      nock(JIMO_BASE_URL).get(JIMO_TEST_PATH).matchHeader('Authorization', 'Bearer invalid-api-key').reply(401, {
        error: 'Unauthorized'
      })

      const authData = {
        apiKey: 'invalid-api-key'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
      expect(nock.isDone()).toBe(true)
    })
  })
})
