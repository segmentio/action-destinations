import nock from 'nock'
import { createTestEvent as _createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { apiBaseUrl } from '../api'

const testDestination = createTestIntegration(Definition)

describe('Saleswings', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(apiBaseUrl).get('/project/account').matchHeader('authorization', 'Bearer myApiKey').reply(200, {})
      await expect(testDestination.testAuthentication({ apiKey: 'myApiKey' })).resolves.not.toThrowError()
    })
  })
})
