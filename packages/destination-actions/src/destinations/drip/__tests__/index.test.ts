import nock from 'nock'
// import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Drip', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.getdrip.com').get('/v2/user').reply(200, {})

      // This should match your authentication.fields
      const authData = {
        apiKey: 'abc123',
        accountId: '42',
        endpoint: 'https://api.getdrip.com/v2'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
