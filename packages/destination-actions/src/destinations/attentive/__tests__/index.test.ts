import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

// Create a test integration using the Definition file
const testDestination = createTestIntegration(Definition)
const apiKey = 'fake-api-key'

describe('Attentive', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      // Mock the Attentive API endpoint for authentication
      nock('https://api.attentivemobile.com')
        .get('/v1/me')
        .matchHeader('Authorization', `Bearer ${apiKey}`)
        .reply(200, {})

      // Provide the required API key in authData
      const authData = {
        apiKey:  // replace with a valid key or mock key as needed
      }

      // Test that the authentication does not throw any error
      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
