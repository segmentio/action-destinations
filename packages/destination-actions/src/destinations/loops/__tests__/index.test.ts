import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Loops', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://app.loops.so/api/v1/api-key').get(/.*/).matchHeader('authorization', `Bearer testId`).reply(200, {
        success: true
      })

      const authData = {
        apiKey: 'testId'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
