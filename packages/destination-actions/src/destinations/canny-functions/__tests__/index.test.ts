import { BASE_API_URL } from '../constants/api'
import Definition from '../index'

import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'

const testDestination = createTestIntegration(Definition)
const TEST_API_KEY = 'test-api-key'

describe('Canny', () => {
  describe('testAuthentication', () => {
    it('should fail if api key is invalid', async () => {
      const authData = { apiKey: TEST_API_KEY }
      nock(BASE_API_URL).post('/validateAPIKey').reply(401, { error: 'invalid secret' })

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })

    it('should return success if api key is valid', async () => {
      const authData = { apiKey: TEST_API_KEY }
      nock(BASE_API_URL).post('/validateAPIKey').reply(200, { success: true })

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
