import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Airship', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://go.urbanairship.com/').post('/api/custom-events/').reply(200, {})

      // This should match your authentication.fields
      const authData = {
        settings: {
          app_key: 'valid-app-key',
          access_token: 'valid-access-token',
          endpoint: 'US'
        }
      }

      await expect(testDestination.testAuthentication(authData.settings)).resolves.not.toThrowError()
    })
  })
  it('should fail authentication with bad creds', async () => {
    nock('https://go.urbanairship.com/').post('/api/custom-events/').reply(401, {})

    const authData = {
      settings: {
        app_key: 'valid-app-key',
        access_token: 'invalid-access-token',
        endpoint: 'US'
      }
    }

    await expect(testDestination.testAuthentication(authData.settings)).rejects.toThrowError()
  })
})
