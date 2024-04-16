import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import { Settings } from '../generated-types'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Yotpo', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://developers.yotpo.com').get(/.*/).reply(200, {})

      // This should match your authentication.fields
      const authData = { store_id: 'store_id' }

      await expect(testDestination.testAuthentication(<Settings>authData)).resolves.not.toThrowError()
    })
  })
})
