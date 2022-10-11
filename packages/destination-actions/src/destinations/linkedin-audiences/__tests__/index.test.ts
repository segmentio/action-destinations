import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { BASE_URL } from '../linkedin-properties'

const testDestination = createTestIntegration(Definition)

describe('Linkedin Audiences', () => {
  describe('testAuthentication', () => {
    it('should not throw an error if all the appropriate credentials are available', async () => {
      const mockProfileResponse = {
        id: '123'
      }

      // Validate that the user exists in LinkedIn.
      nock(`${BASE_URL}/me`).get(/.*/).reply(200, mockProfileResponse)

      const mockAdAccountResponse = {
        role: 'ACCOUNT_BILLING_ADMIN'
      }

      // Validate that the user has permission to write to DMP Segments (audiences) in the LinkedIn Ad Account.
      nock(`${BASE_URL}/adAccounts`).get(/.*/).reply(200, mockAdAccountResponse)

      const authData = {
        ad_account_id: 'testId',
        oauth: {
          access_token: '123',
          refresh_token: '123'
        }
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should throw an error if the user has not completed the oauth flow', async () => {
      const authData = {
        ad_account_id: 'testId'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        'Credentials are invalid:  Please authenticate via Oauth before updating other settings and/or enabling the destination.'
      )
    })

    it('should throw an error if the oauth token is invalid', async () => {
      nock(`${BASE_URL}/me`).get(/.*/).reply(401)

      const authData = {
        ad_account_id: 'testId',
        oauth: {
          access_token: '123',
          refresh_token: '123'
        }
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        'Credentials are invalid:  Invalid LinkedIn Oauth access token. Please reauthenticate to retrieve a valid access token before updating other settings and/or enabling the destination.'
      )
    })

    it('should throw an error if an ad account in LinkedIn is not found', async () => {
      const mockProfileResponse = {
        id: '123'
      }

      nock(`${BASE_URL}/me`).get(/.*/).reply(200, mockProfileResponse)
      nock(`${BASE_URL}/adAccounts`).get(/.*/).reply(404)

      const authData = {
        ad_account_id: 'testId',
        oauth: {
          access_token: '123',
          refresh_token: '123'
        }
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        'Credentials are invalid:  Invalid LinkedIn Ad Account id. Please verify that the LinkedIn Ad Account exists and that you have access to it.'
      )
    })

    it('should throw an error if the user does not have write permissions to the LinkedIn ad account', async () => {
      const mockProfileResponse = {
        id: '123'
      }

      // Validate that the user exists in LinkedIn.
      nock(`${BASE_URL}/me`).get(/.*/).reply(200, mockProfileResponse)

      const mockAdAccountResponse = {
        role: 'VIEWER'
      }

      nock(`${BASE_URL}/adAccounts`).get(/.*/).reply(200, mockAdAccountResponse)

      const authData = {
        ad_account_id: 'testId',
        oauth: {
          access_token: '123',
          refresh_token: '123'
        }
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        "Credentials are invalid:  It looks like you don't have access to this LinkedIn Ad Account. Please reach out to a LinkedIn Ad Account Admin on your team to grant access."
      )
    })

    it('should throw the raw error from LinkedIn if the error is not handled elsewhere in the `testAuthentication` method', async () => {
      const mockProfileResponse = {
        id: '123'
      }

      nock(`${BASE_URL}/me`).get(/.*/).reply(200, mockProfileResponse)
      nock(`${BASE_URL}/adAccounts`).get(/.*/).reply(500)

      const authData = {
        ad_account_id: 'testId',
        oauth: {
          access_token: '123',
          refresh_token: '123'
        }
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        'Credentials are invalid: 500 Internal Server Error'
      )
    })
  })
})
