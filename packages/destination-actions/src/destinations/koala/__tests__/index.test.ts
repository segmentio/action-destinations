import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Koala', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api2.getkoala.com/web/projects/testId').get('/auth').reply(204, {})

      await expect(
        testDestination.testAuthentication({
          public_key: 'testId'
        })
      ).resolves.not.toThrowError()
    })
  })
})
