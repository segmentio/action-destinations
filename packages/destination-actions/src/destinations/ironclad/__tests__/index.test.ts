import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Ironclad', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://pactsafe.io').get('*').reply(200, {})

      const authData = {
        sid: 'site-access-id',
        staging_endpoint: true,
        test_mode: true
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
