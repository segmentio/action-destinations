import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { apiBaseUrl } from '../properties'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)

describe('Livelike', () => {
  describe('testAuthentication', () => {
    it('should throw an error in case of invalid inputs', async () => {
      nock(apiBaseUrl).get('/applications/abc/validate-app/').matchHeader('authorization', `Bearer 123`).reply(401, {})

      const authData = { clientId: 'abc', producerToken: '123' }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })

    it('should validate authentication inputs', async () => {
      nock(apiBaseUrl).get('/applications/abc/validate-app/').matchHeader('authorization', `Bearer 123`).reply(200, {})

      const authData = { clientId: 'abc', producerToken: '123' }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should throw error when clientId and producerToken is not configured', async () => {
      await expect(testDestination.testAuthentication({} as Settings)).rejects.toThrowError(
        "The root value is missing the required field 'clientId'. The root value is missing the required field 'producerToken'."
      )
    })
  })
})
