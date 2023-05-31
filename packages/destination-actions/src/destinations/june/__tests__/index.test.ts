import nock from 'nock';
import { createTestIntegration } from '@segment/actions-core';
import Definition from '../index';

const testDestination = createTestIntegration(Definition)

describe('June', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.june.so/api/validate-write-key')
        .get(/.*/)
        .matchHeader('authorization', `Basic testId`)
        .reply(200, {
          success: true
        })

      const authData = {
        apiKey: 'testId'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
