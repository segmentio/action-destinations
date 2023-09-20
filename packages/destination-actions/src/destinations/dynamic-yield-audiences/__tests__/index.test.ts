import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Dynamic Yield Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const authData = {
        sectionId: 'valid-section-id',
        dataCenter: 'com',
        accessKey: 'valid-access-key'
      }
      nock(/.*/).persist().post(/.*/).reply(200)

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
