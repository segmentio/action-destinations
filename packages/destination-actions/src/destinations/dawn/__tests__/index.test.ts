import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Dawn Analytics', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.dawnai.com')
        .post('/validate-auth')
        .matchHeader('authorization', 'Bearer test-write-key')
        .matchHeader('user-agent', 'Segment (Actions)')
        .matchHeader('content-type', 'application/json')
        .reply(200, {})

      // This should match your authentication.fields
      const authData = {
        writeKey: 'test-write-key'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
