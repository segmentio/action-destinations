import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Pushwoosh', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://integration-segment.svc-nue.pushwoosh.com').post('/integration-segment/v1/ping').reply(200, {})

      // This should match your authentication.fields
      const authData = {
        settings: {
          pushwooshAPIKey: 'valid-api-key',
          pushwooshAppCode: 'valid-app-code'
        }
      }

      await expect(testDestination.testAuthentication(authData.settings)).resolves.not.toThrowError()
    })
    it('should fail authentication with bad creds', async () => {
      nock('https://integration-segment.svc-nue.pushwoosh.com').post('/integration-segment/v1/ping').reply(401, {})

      const authData = {
        settings: {
          pushwooshAPIKey: 'valid-app-key',
          pushwooshAppCode: 'invalid-access-token'
        }
      }

      await expect(testDestination.testAuthentication(authData.settings)).rejects.toThrowError()
    })
  })
})
