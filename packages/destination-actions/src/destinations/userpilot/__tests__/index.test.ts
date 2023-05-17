import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const apiKey = 'fake-api-key'
const baseUrl = 'https://analytex.userpilot.io/'

describe('Userpilot', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(baseUrl).get('/v1/users').reply(200, {})

      // This should match your authentication.fields
      const authData = {
        apiKey: apiKey,
        endpoint: baseUrl
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
