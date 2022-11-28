import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Braze Cohorts', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://your.destination.endpoint').get('*').reply(200, {})

      // This should match your authentication.fields
      const authData = {
        settings: {
          endpoint: 'https://rest.iad-01.braze.com',
          client_secret: 'Invalid_secret_key'
        }
      }

      await expect(testDestination.testAuthentication(authData.settings)).resolves.not.toThrowError()
    })
  })
})
