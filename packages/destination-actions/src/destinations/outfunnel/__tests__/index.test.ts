import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Outfunnel', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api-pls.outfunnel.com')
        .get('/v1/user')
        .query(true)
        .reply(200, {})

      // This should match your authentication.fields
      const authData = {
        userId: '63d1535e64583e42bbc60662',
        apiToken: '54tawsfqewfasfgasdasfas'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
