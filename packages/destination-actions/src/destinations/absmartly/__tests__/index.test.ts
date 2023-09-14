import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)

describe('ABsmartly', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const settings: Settings = {
        apiKey: 'testkey',
        environment: 'dev',
        collectorEndpoint: 'https://test.absmartly.io/v1'
      }

      nock(settings.collectorEndpoint)
        .get('/context/authed')
        .matchHeader('X-API-Key', settings.apiKey)
        .matchHeader('X-Environment', settings.environment)
        .reply(200, {})

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should throw when authentication fails', async () => {
      const settings: Settings = {
        apiKey: 'testkey',
        environment: 'dev',
        collectorEndpoint: 'https://test.absmartly.io/v1'
      }

      nock(settings.collectorEndpoint)
        .get('/context/authed')
        .matchHeader('X-API-Key', settings.apiKey)
        .matchHeader('X-Environment', settings.environment)
        .reply(401, {})

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })
})
