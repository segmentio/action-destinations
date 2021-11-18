import nock from 'nock'
import {  createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Clevertap( Actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.clevertap.com').get('/1/upload').reply(200, {})

      // This should match your authentication.fields
      const authData = {
          settings: {
            clevertapAccountId:'test-account-id',
            clevertapPasscode:'test-account-passcode'
          }
      }


      await expect(testDestination.testAuthentication(authData.settings)).resolves.not.toThrowError()
    })
  })
})
