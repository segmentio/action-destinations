import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { apiBaseUrl } from '../properties'

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
  })
})
