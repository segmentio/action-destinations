import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
const endpoint = 'https://api.hubapi.com/crm/v3/objects'

describe('Hubspot Cloud Mode (actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(endpoint).get('/contacts?limit=1').reply(200, {})
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock(endpoint).get('/contacts?limit=1').reply(401, {})
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        new Error('Credentials are invalid: 401 Unauthorized')
      )
    })
  })
})
