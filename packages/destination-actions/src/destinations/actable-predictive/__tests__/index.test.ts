import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition, { API_URL } from '../index'

const testDestination = createTestIntegration(Definition)

describe('Actable Predictive', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(API_URL).post('').reply(200, {})

      // This should match your authentication.fields
      const authData = { client_id: "foo", client_secret: "bar" }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
