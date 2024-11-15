import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

// Create a test integration using the Definition file
const testDestination = createTestIntegration(Definition)
const apiKey = 'fake-api-key'

export const authData = {
  api_key: apiKey
}

describe('Attentive', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      // Mock the Attentive API endpoint for authentication
      nock('https://api.attentivemobile.com')
        .get('/v1/me')
        .matchHeader('Authorization', `Bearer ${apiKey}`)
        .reply(200, {})

      // Test that the authentication does not throw any error
      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
