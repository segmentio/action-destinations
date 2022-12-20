import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { apiBaseUrl } from '../api'

const testDestination = createTestIntegration(Definition)

describe('Saleswings', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(apiBaseUrl).get('/project/account').matchHeader('authorization', 'Bearer myApiKey').reply(200, {})
      await expect(testDestination.testAuthentication({ apiKey: 'myApiKey' })).resolves.not.toThrowError()
    })

    it('should reject invalid API key', async () => {
      nock(apiBaseUrl).get('/project/account').matchHeader('authorization', 'Bearer myApiKey').reply(200, {})
      nock(apiBaseUrl).get('/project/account').reply(401, {})
      await expect(testDestination.testAuthentication({ apiKey: 'invalidApiKey' })).rejects.toThrowError()
    })
  })
})
