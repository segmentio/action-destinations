import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { CONSTANTS } from '../constants'

const testDestination = createTestIntegration(Definition)

describe('Launchdarkly Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const authData = {
        clientId: 'valid-id',
        apiKey: 'valid-key'
      }
      nock(CONSTANTS.LD_CLIENT_SDK_BASE_URL).head(`/sdk/goals/${authData.clientId}`).reply(200, {})
      nock(CONSTANTS.LD_API_BASE_URL).get('/versions').matchHeader('authorization', authData.apiKey).reply(200, {})

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should reject invalid client IDs', async () => {
      const authData = {
        clientId: 'invalid-id',
        apiKey: 'valid-key'
      }
      nock(CONSTANTS.LD_CLIENT_SDK_BASE_URL).head(`/sdk/goals/${authData.clientId}`).reply(404, {})
      nock(CONSTANTS.LD_API_BASE_URL).get('/versions').matchHeader('authorization', authData.apiKey).reply(200, {})

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })

    it('should reject invalid client IDs', async () => {
      const authData = {
        clientId: 'valid-id',
        apiKey: 'invalid-key'
      }
      nock(CONSTANTS.LD_CLIENT_SDK_BASE_URL).head(`/sdk/goals/${authData.clientId}`).reply(200, {})
      nock(CONSTANTS.LD_API_BASE_URL).get('/versions').matchHeader('authorization', authData.apiKey).reply(403, {})

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
