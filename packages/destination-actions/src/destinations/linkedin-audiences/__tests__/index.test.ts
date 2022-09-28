import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Linkedin Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.linkedin.com/rest/adAccounts').get(/.*/).reply(200, {})

      const authData = {
        ad_account_id: 'testId',
        oauth: {
          access_token: '123',
          refresh_token: '123'
        }
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
