import nock from 'nock'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Criteo', () => {
  describe('testAuthentication', () => {
    it.skip('should validate authentication inputs', async () => {
      nock('https://your.destination.endpoint').get('*').reply(200, {})

      // This should match your authentication.fields
      const authData = {
        api_key: 'super_secret_123'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
