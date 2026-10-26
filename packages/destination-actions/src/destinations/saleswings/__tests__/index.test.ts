import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { authenticationUrl } from '../api'

const testDestination = createTestIntegration(Definition)

describe('Saleswings', () => {
  const env = 'helium'
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(authenticationUrl(env)).get('').matchHeader('authorization', 'Bearer myApiKey').reply(200, {})
      await expect(
        testDestination.testAuthentication({ apiKey: 'myApiKey', environment: env })
      ).resolves.not.toThrowError()
    })

    it.each(['argon', 'ozone'])('should support non-default environment %s', async (otherEnv) => {
      nock(authenticationUrl(otherEnv)).get('').matchHeader('authorization', 'Bearer myApiKey').reply(200, {})
      await expect(
        testDestination.testAuthentication({ apiKey: 'myApiKey', environment: otherEnv })
      ).resolves.not.toThrowError()
    })

    it('should reject invalid API key', async () => {
      nock(authenticationUrl(env)).get('').matchHeader('authorization', 'Bearer myApiKey').reply(200, {})
      nock(authenticationUrl(env)).get('').reply(401, {})
      await expect(
        testDestination.testAuthentication({ apiKey: 'invalidApiKey', environment: env })
      ).rejects.toThrowError()
    })
  })
})
