import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Actable Predictive', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('http://127.0.0.1:8080/').post('/').reply(200, {})

      // This should match your authentication.fields
      const authData = { client_id: "foo", client_secret: "bar" }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
