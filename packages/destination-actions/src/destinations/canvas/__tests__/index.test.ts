import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { getAuthUrl } from '../api'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)

describe('Canvas', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const settings: Settings = {
        apiToken: 'myApiToken'
      }
      nock(getAuthUrl()).post('').matchHeader('X-Auth-Token', settings.apiToken).reply(200, {})
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should reject invalid API key', async () => {
      const settings: Settings = {
        apiToken: 'myApiToken'
      }
      nock(getAuthUrl()).post('').matchHeader('X-Auth-Token', settings.apiToken).reply(200, {})
      await expect(testDestination.testAuthentication({ apiToken: 'invalidApiToken' })).rejects.toThrowError()
    })
  })
})
