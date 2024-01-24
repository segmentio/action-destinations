import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { getAccountUrl } from '../api'

const testDestination = createTestIntegration(Definition)

describe('Saleswings', () => {
  const env = 'helium'
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(getAccountUrl(env)).get('').matchHeader('authorization', 'Bearer myApiKey').reply(200, {})
      await expect(
        testDestination.testAuthentication({ apiKey: 'myApiKey', environment: env })
      ).resolves.not.toThrowError()
    })

    it('should support non-default environment', async () => {
      const otherEnv = 'ozone'
      nock(getAccountUrl(otherEnv)).get('').matchHeader('authorization', 'Bearer myApiKey').reply(200, {})
      await expect(
        testDestination.testAuthentication({ apiKey: 'myApiKey', environment: otherEnv })
      ).resolves.not.toThrowError()
    })

    it('should reject invalid API key', async () => {
      nock(getAccountUrl(env)).get('').matchHeader('authorization', 'Bearer myApiKey').reply(200, {})
      nock(getAccountUrl(env)).get('').reply(401, {})
      await expect(
        testDestination.testAuthentication({ apiKey: 'invalidApiKey', environment: env })
      ).rejects.toThrowError()
    })
  })
})
