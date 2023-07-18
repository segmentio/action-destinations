import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Launchdarkly Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const authData = {
        clientId: 'valid-id',
        apiKey: 'valid-key'
      }
      nock(`https://clientsdk.launchdarkly.com`).head(`/sdk/goals/${authData.clientId}`).reply(200, {})
      nock(`https://app.launchdarkly.com/api/v2`)
        .get('/versions')
        .matchHeader('authorization', authData.apiKey)
        .reply(200, {})

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should reject invalid client IDs', async () => {
      const authData = {
        clientId: 'invalid-id',
        apiKey: 'valid-key'
      }
      nock(`https://clientsdk.launchdarkly.com`).head(`/sdk/goals/${authData.clientId}`).reply(404, {})
      nock(`https://app.launchdarkly.com/api/v2`)
        .get('/versions')
        .matchHeader('authorization', authData.apiKey)
        .reply(200, {})

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })

    it('should reject invalid client IDs', async () => {
      const authData = {
        clientId: 'valid-id',
        apiKey: 'invalid-key'
      }
      nock(`https://clientsdk.launchdarkly.com`).head(`/sdk/goals/${authData.clientId}`).reply(200, {})
      nock(`https://app.launchdarkly.com/api/v2`)
        .get('/versions')
        .matchHeader('authorization', authData.apiKey)
        .reply(403, {})

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
