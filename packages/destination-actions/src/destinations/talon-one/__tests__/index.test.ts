import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import type { Settings } from '../generated-types'
import nock from 'nock'

const testDestination = createTestIntegration(Definition)

describe('Talon One', () => {
  describe('testAuthentication', () => {
    it('valid auth token', async () => {
      nock('https://something.europe-west1.talon.one')
        .get('/v2/authping')
        .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
        .reply(204, {})

      const settings: Settings = {
        apiKey: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('invalidate auth token', async () => {
      nock('https://something.europe-west1.talon.one')
        .get('/v2/authping')
        .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
        .reply(401, {})

      const settings: Settings = {
        apiKey: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })
})
