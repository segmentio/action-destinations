import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { ATTRIBUTION_ENDPOINT } from '../constants'

const testDestination = createTestIntegration(Definition)
const authData = {
  projectID: 'test-project-id'
}

describe('Attribution', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(ATTRIBUTION_ENDPOINT).post('/check_auth').reply(200, {})

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock(ATTRIBUTION_ENDPOINT).post('/check_auth').reply(401, {})

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        new Error('Credentials are invalid: 401 Unauthorized')
      )
    })
  })
})
