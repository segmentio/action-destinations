import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Prodeology', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api-dev.prodeology.com/api/v1/event-collection/validate-api-key')
        .get(/.*/)
        .matchHeader('authorization', `Basic api-key`)
        .reply(200, {})

      const authData = {
        apiKey: 'api-key'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
