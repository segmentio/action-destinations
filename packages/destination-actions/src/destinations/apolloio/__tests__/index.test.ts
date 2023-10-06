import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
describe('Apolloio', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.apollo.io/v1/auth/health?api_key=').get('*').reply(200, { healthy: true, is_logged_in: true })
      const settings = {
        apiToken: 'YOUR_API_KEY_HERE'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
