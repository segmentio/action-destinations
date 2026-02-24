import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

describe('Datadog', () => {
  describe('testAuthentication', () => {
    it('should validate authentication with a valid API key', async () => {
      nock('https://api.datadoghq.com').get('/api/v1/validate').reply(200, { valid: true })

      await expect(
        testDestination.testAuthentication({
          apiKey: 'valid_test_api_key',
          appKey: 'valid_test_app_key',
          site: 'datadoghq.com'
        })
      ).resolves.not.toThrowError()
    })

    it('should use the correct site URL for EU region', async () => {
      nock('https://api.datadoghq.eu').get('/api/v1/validate').reply(200, { valid: true })

      await expect(
        testDestination.testAuthentication({
          apiKey: 'valid_test_api_key',
          appKey: 'valid_test_app_key',
          site: 'datadoghq.eu'
        })
      ).resolves.not.toThrowError()
    })

    it('should throw an error for an invalid API key', async () => {
      nock('https://api.datadoghq.com')
        .get('/api/v1/validate')
        .reply(403, { errors: ['Authentication error'] })

      await expect(
        testDestination.testAuthentication({
          apiKey: 'invalid_api_key',
          appKey: 'invalid_app_key',
          site: 'datadoghq.com'
        })
      ).rejects.toThrowError()
    })

    it('should default to datadoghq.com when site is not provided', async () => {
      nock('https://api.datadoghq.com').get('/api/v1/validate').reply(200, { valid: true })

      await expect(
        testDestination.testAuthentication({
          apiKey: 'valid_test_api_key',
          appKey: 'valid_test_app_key'
        })
      ).resolves.not.toThrowError()
    })
  })
})
