import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { BASE_URL } from '../constants'

const testDestination = createTestIntegration(Definition)

const validSettings = {
  ad_account_id: 'testId',
  send_email: true,
  send_google_advertising_id: true,
  oauth: {
    access_token: '123',
    refresh_token: '123'
  }
}

const invalidOauth = {
  ad_account_id: 'testId',
  send_email: true,
  send_google_advertising_id: true
}

const invalidSettings = {
  ad_account_id: 'testId',
  send_email: false,
  send_google_advertising_id: false,
  oauth: {
    access_token: '123',
    refresh_token: '123'
  }
}

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

      await expect(testDestination.testAuthentication(validSettings)).resolves.not.toThrowError()
    })

    it('should throw an error if the user has not completed the oauth flow', async () => {
      await expect(testDestination.testAuthentication(invalidOauth)).rejects.toThrowError(
        'Credentials are invalid:  Please authenticate via Oauth before updating other settings and/or enabling the destination.'
      )
    })

    it('should throw an error if the oauth token is invalid', async () => {
      nock(`${BASE_URL}/me`).get(/.*/).reply(401)

      await expect(testDestination.testAuthentication(validSettings)).rejects.toThrowError(
        'Credentials are invalid:  Invalid LinkedIn Oauth access token. Please reauthenticate to retrieve a valid access token before updating other settings and/or enabling the destination.'
      )
    })

    it('should throw an error if an ad account in LinkedIn is not found', async () => {
      const mockProfileResponse = {
        id: '123'
      }

      nock(`${BASE_URL}/me`).get(/.*/).reply(200, mockProfileResponse)
      nock(`${BASE_URL}/adAccounts`).get(/.*/).reply(404)

      await expect(testDestination.testAuthentication(validSettings)).rejects.toThrowError(
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

      await expect(testDestination.testAuthentication(validSettings)).rejects.toThrowError(
        'Credentials are invalid:  Access to the provided Ad Account with a role other than Viewer is required. Please reach out to a LinkedIn Ad Account Admin on your team to grant proper access.'
      )
    })

    it('should throw the raw error from LinkedIn if the error is not handled elsewhere in the `testAuthentication` method', async () => {
      const mockProfileResponse = {
        id: '123'
      }

      nock(`${BASE_URL}/me`).get(/.*/).reply(200, mockProfileResponse)
      nock(`${BASE_URL}/adAccounts`).get(/.*/).reply(500)

      await expect(testDestination.testAuthentication(validSettings)).rejects.toThrowError(
        'Credentials are invalid: 500 Internal Server Error'
      )
    })

    it('should throw an error if no identifiers will be mapped', async () => {
      await expect(testDestination.testAuthentication(invalidSettings)).rejects.toThrowError(
        'Credentials are invalid:  At least one of `Send Email` or `Send Google Advertising ID` must be set to `true`.'
      )
    })
  })
})
