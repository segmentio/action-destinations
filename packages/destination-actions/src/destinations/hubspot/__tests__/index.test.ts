import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { HUBSPOT_BASE_URL } from '../properties'

const testDestination = createTestIntegration(Definition)

describe('HubSpot Cloud Mode (Actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(HUBSPOT_BASE_URL).get('/crm/v3/objects/contacts?limit=1').reply(200, {})
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock(HUBSPOT_BASE_URL).get('/crm/v3/objects/contacts?limit=1').reply(401, {})
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        new Error('Credentials are invalid: 401 Unauthorized')
      )
    })
  })
})
