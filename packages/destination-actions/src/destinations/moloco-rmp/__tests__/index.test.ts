import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Moloco Rmp', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      const authData = {
        platformId: 'foo',
        apiKey: 'bar'
      }

      // TODO: This test is not complete. It should be updated to test the authentication function
      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
