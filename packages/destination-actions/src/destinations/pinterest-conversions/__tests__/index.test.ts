import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { API_VERSION } from '../constants'

const testDestination = createTestIntegration(Definition)

describe('Pinterest Conversions Api', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const authData: Settings = {
        ad_account_id: 'test_ad_account_id',
        conversion_token: 'test_conversion_token'
      }

      nock(`https://api.pinterest.com`)
        .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events?test=true`)
        .reply(200, {})
      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should throw 403 forbidden in case of invalid account_id', async () => {
      const authData: Settings = {
        ad_account_id: 'invalid_ad_account_id',
        conversion_token: 'test_conversion_token'
      }

      nock(`https://api.pinterest.com`)
        .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events?test=true`)
        .reply(403, {
          code: 29,
          message: 'You are not permitted to access that resource.'
        })
      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })

    it('should throw 401 Unauthorized in case of invalid_conversion_token', async () => {
      const authData: Settings = {
        ad_account_id: 'invalid_ad_account_id',
        conversion_token: 'test_conversion_token'
      }

      nock(`https://api.pinterest.com`)
        .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events?test=true`)
        .reply(401, {
          code: 2,
          message: 'Authentication failed.',
          status: 'failure'
        })
      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
