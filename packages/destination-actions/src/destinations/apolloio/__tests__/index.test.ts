import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const VALID_SETTINGS = {
  apiToken: 'YOUR_API_KEY_HERE'
}

const MOCK_TOKEN_RESPONSE = { healthy: true, is_logged_in: false }

describe('Apolloio', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.apollo.io/').get('*').reply(200, MOCK_TOKEN_RESPONSE)
      const settings = VALID_SETTINGS
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
