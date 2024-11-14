import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

// Create a test integration using the Definition file
const testDestination = createTestIntegration(Definition)

describe('Attentive', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      // Mock the Attentive API endpoint for authentication
      nock('https://api.attentivemobile.com')
        .get('/v1/me')
        .matchHeader('Authorization', 'Bearer test_api_key')
        .reply(200, {})

      // Provide the required API key in authData
      const authData = {
        apiKey: 'akd2cUJOQXhWU1FmeU9PY1FBMFlJMFNaYVVyalZqeDJ0QXht' // replace with a valid key or mock key as needed
      }

      // Test that the authentication does not throw any error
      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
