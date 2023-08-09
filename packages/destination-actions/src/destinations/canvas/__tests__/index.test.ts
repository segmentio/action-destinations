import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { getAuthUrl } from '../api'

const testDestination = createTestIntegration(Definition)

describe('Canvas', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(getAuthUrl()).get('').matchHeader('authorization', 'Bearer myApiToken').reply(200, {})
      await expect(testDestination.testAuthentication({ apiToken: 'myApiToken' })).resolves.not.toThrowError()
    })

    it('should reject invalid API key', async () => {
      nock(getAuthUrl()).get('').matchHeader('authorization', 'Bearer myApiToken').reply(200, {})
      nock(getAuthUrl()).get('').reply(401, {})
      await expect(testDestination.testAuthentication({ apiToken: 'invalidApiToken' })).rejects.toThrowError()
    })
  })
})
