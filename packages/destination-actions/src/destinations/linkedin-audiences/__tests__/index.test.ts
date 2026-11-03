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

  describe('refreshAccessToken', () => {
    const OLD_ENV = process.env

    beforeEach(() => {
      jest.resetModules() // Most important - it clears the cache
      process.env = { ...OLD_ENV } // Make a copy

      process.env.ACTIONS_LINKEDIN_AUDIENCES_CLIENT_ID = 'client_id'
      process.env.ACTIONS_LINKEDIN_AUDIENCES_CLIENT_SECRET = 'client_secret'
    })

    afterAll(() => {
      process.env = OLD_ENV // Restore old environment
    })

    it('should correctly request a new access token', async () => {
      nock(`https://www.linkedin.com`)
        .post('/oauth/v2/accessToken', {
          grant_type: 'refresh_token',
          client_id: 'client_id',
          client_secret: 'client_secret',
          refresh_token: 'refresh_token'
        })
        .reply(200, {
          access_token: 'new_token',
          expires_in: 5183999,
          refresh_token: 'refresh_token',
          refresh_token_expires_in: 31535960,
          scope: 'r_basicprofile,rw_ads,rw_dmp_segments'
        })

      const response = await testDestination.refreshAccessToken(validSettings, {
        refreshToken: 'refresh_token',
        // The OAuth2ClientCredentials type requires these values below, however they are not actually
        // passed into the function at runtime. The type is incorrect. Passing fake values here to satisfy the type.
        clientId: 'fake-unused-client_id',
        clientSecret: 'fake-unused-client_secret',
        accessToken: 'fake-unused-access-token'
      })

      expect(response).toEqual({ accessToken: 'new_token' })
    })

    it('should throw an error if the client id is missing when requesting a new access token', async () => {
      process.env.ACTIONS_LINKEDIN_AUDIENCES_CLIENT_ID = undefined

      await expect(
        testDestination.refreshAccessToken(validSettings, {
          refreshToken: 'refresh_token',
          // The OAuth2ClientCredentials type requires these values below, however they are not actually
          // passed into the function at runtime. The type is incorrect. Passing fake values here to satisfy the type.
          clientId: 'fake-unused-client_id',
          clientSecret: 'fake-unused-client_secret',
          accessToken: 'fake-unused-access-token'
        })
      ).rejects.toThrowError('Missing client ID')
    })

    it('should throw an error if the client secret is missing when requesting a new access token', async () => {
      process.env.ACTIONS_LINKEDIN_AUDIENCES_CLIENT_SECRET = undefined

      await expect(
        testDestination.refreshAccessToken(validSettings, {
          refreshToken: 'refresh_token',
          // The OAuth2ClientCredentials type requires these values below, however they are not actually
          // passed into the function at runtime. The type is incorrect. Passing fake values here to satisfy the type.
          clientId: 'fake-unused-client_id',
          clientSecret: 'fake-unused-client_secret',
          accessToken: 'fake-unused-access-token'
        })
      ).rejects.toThrowError('Missing client secret')
    })

    it('should throw an error if the refresh token is missing when requesting a new access token', async () => {
      await expect(
        testDestination.refreshAccessToken(validSettings, {
          refreshToken: '',
          // The OAuth2ClientCredentials type requires these values below, however they are not actually
          // passed into the function at runtime. The type is incorrect. Passing fake values here to satisfy the type.
          clientId: 'fake-unused-client_id',
          clientSecret: 'fake-unused-client_secret',
          accessToken: 'fake-unused-access-token'
        })
      ).rejects.toThrowError('Missing refresh token. Please re-authenticate to fetch a new refresh token.')
    })

    it('should throw an error if the refresh token is invalid or expired', async () => {
      nock(`https://www.linkedin.com`).post('/oauth/v2/accessToken').reply(400, {
        error: 'invalid_grant',
        error_description: 'refresh token is invalid or expired'
      })

      await expect(
        testDestination.refreshAccessToken(validSettings, {
          refreshToken: 'refresh_token',
          clientId: 'fake-unused-client_id',
          clientSecret: 'fake-unused-client_secret',
          accessToken: 'fake-unused-access-token'
        })
      ).rejects.toThrowError(
        'Invalid Authentication: Your refresh token is invalid or expired. Please re-authenticate to fetch a new refresh token.'
      )
    })
  })
})
