import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Taguchi', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('testAuthentication', () => {
    it('should validate authentication with correct credentials', async () => {
      // Mock the test endpoint (URL with /prod replaced by /test)
      nock('https://api.taguchi.com.au')
        .post('/test/subscriber')
        .reply(200, [
          {
            code: 200,
            name: 'Success',
            description: 'Authentication successful'
          }
        ])

      const authData = {
        apiKey: 'test-api-key',
        integrationURL: 'https://api.taguchi.com.au/prod',
        organizationId: '123'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should handle authentication failure', async () => {
      // Mock authentication failure
      nock('https://api.taguchi.com.au').post('/test/subscriber').reply(401, {
        code: 401,
        name: 'Unauthorized',
        description: 'Invalid API key'
      })

      const authData = {
        apiKey: 'invalid-api-key',
        integrationURL: 'https://api.taguchi.com.au/prod',
        organizationId: '123'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })

    it('should handle invalid integration URL', async () => {
      // Mock network error for invalid URL
      nock('https://invalid.endpoint.com')
        .post('/test/subscriber')
        .replyWithError('getaddrinfo ENOTFOUND invalid.endpoint.com')

      const authData = {
        apiKey: 'test-api-key',
        integrationURL: 'https://invalid.endpoint.com/prod',
        organizationId: '123'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })

    it('should replace /prod with /test in URL', async () => {
      // Verify that the test endpoint is called correctly
      const scope = nock('https://api.taguchi.com.au')
        .post('/test/subscriber', (body) => {
          // Verify the request body structure
          expect(Array.isArray(body)).toBe(true)
          expect(body[0]).toHaveProperty('profile')
          expect(body[0].profile).toHaveProperty('organizationId', 123)
          expect(body[0].profile).toHaveProperty('ref', 'test-connection')
          expect(body[0].profile).toHaveProperty('firstname', 'Test')
          return true
        })
        .reply(200, [
          {
            code: 200,
            name: 'Success',
            description: 'Test connection successful'
          }
        ])

      const authData = {
        apiKey: 'test-api-key',
        integrationURL: 'https://api.taguchi.com.au/prod',
        organizationId: '123'
      }

      await testDestination.testAuthentication(authData)

      // Verify that the correct endpoint was called
      expect(scope.isDone()).toBe(true)
    })
  })
})
