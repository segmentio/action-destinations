import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { BASE_URL } from '../constants'

const testDestination = createTestIntegration(Definition)

const validSettings = {
  oauth: {
    access_token: '123',
    refresh_token: '123'
  }
}

describe('Linkedin Conversions Api', () => {
  describe('testAuthentication', () => {
    it('should not throw an error if all the appropriate credentials are available', async () => {
      const mockProfileResponse = {
        id: '123'
      }

      // Validate that the user exists in LinkedIn.
      nock(`${BASE_URL}/me`).get(/.*/).reply(200, mockProfileResponse)

      await expect(testDestination.testAuthentication(validSettings)).resolves.not.toThrowError()
    })

    it('should throw an error if the user has not completed the oauth flow', async () => {
      const invalidOauth = {}
      await expect(testDestination.testAuthentication(invalidOauth)).rejects.toThrowError(
        'Credentials are invalid:  Please authenticate via Oauth before enabling the destination.'
      )
    })

    it('should throw an error if the oauth token is invalid', async () => {
      nock(`${BASE_URL}/me`).get(/.*/).reply(401)

      await expect(testDestination.testAuthentication(validSettings)).rejects.toThrowError(
        'Credentials are invalid:  Invalid LinkedIn Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
      )
    })
  })

  describe('refreshAccessToken', () => {
    const OLD_ENV = process.env

    beforeEach(() => {
      jest.resetModules() // Most important - it clears the cache
      process.env = { ...OLD_ENV } // Make a copy

      process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_ID = 'client_id'
      process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_SECRET = 'client_secret'
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
          scope: 'r_basicprofile,rw_ads,rw_conversions'
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
      process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_ID = undefined

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
      process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_SECRET = undefined

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
  })
})
