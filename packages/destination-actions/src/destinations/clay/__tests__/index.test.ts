import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition, { CLAY_API_BASE_URL } from '../index'

const testDestination = createTestIntegration(Definition)

describe('Clay', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(CLAY_API_BASE_URL).get('/segment/test_connection_key/auth').reply(200, {})

      await expect(
        testDestination.testAuthentication({
          connection_key: 'test_connection_key',
          secret_key: 'test_secret_key'
        })
      ).resolves.not.toThrowError()
    })
  })
})
