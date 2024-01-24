import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { baseUrl } from '../constants'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Toplyne', () => {
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

    it('should throw an error if the api key is invalid', async () => {
      nock(baseUrl).get('/auth/verify').reply(403, {})

      // This should match your authentication.fields
      const authData = {
        apiKey: 'test-wrong-api-key'
      }

      // expect status to be 403
      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
