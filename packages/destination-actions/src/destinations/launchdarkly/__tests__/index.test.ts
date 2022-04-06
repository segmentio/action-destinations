import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('LaunchDarkly', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const validClientID = '42444399574f7e151fa8c94b'
      nock(`https://clientsdk.launchdarkly.com`).head(`/sdk/goals/${validClientID}`).reply(200, {})
      const authData = {
        client_id: validClientID
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
    it('should reject invalid client IDs', async () => {
      nock(`https://clientsdk.launchdarkly.com`).head(`/sdk/goals/invalid`).reply(404, {})
      const authData = {
        client_id: 'invalid'
      }
      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
