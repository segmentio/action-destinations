import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import destination from '../index'

const testDestination = createTestIntegration(destination)

describe('Apollo.io', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const settings = {
        apiToken: 'test'
      }

      nock(`https://apollo.io/${settings.apiToken}`).get(/.*/).reply(200, { is_logged_in: true })

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
