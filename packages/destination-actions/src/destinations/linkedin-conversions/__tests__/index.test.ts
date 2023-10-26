import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { BASE_URL } from '../constants'

const testDestination = createTestIntegration(Definition)

const settings = {
  oauth: {
    access_token: '123',
    refresh_token: '123'
  }
}

describe('Linkedin Conversions Api', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const mockProfileResponse = {
        id: '456'
      }

      // Validate that the user exists in LinkedIn.
      nock(`${BASE_URL}/me`).get(/.*/).reply(200, mockProfileResponse)

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should throw an error if the user has not completed the oauth flow', async () => {
      await expect(testDestination.testAuthentication({})).rejects.toThrowError(
        'Credentials are invalid:  Please authenticate via Oauth before enabling the destination.'
      )
    })

    it('should throw an error if the oauth token is invalid', async () => {
      nock(`${BASE_URL}/me`).get(/.*/).reply(401)

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError(
        'Credentials are invalid:  Invalid LinkedIn Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
      )
    })

    it('should throw the raw error from LinkedIn if the error is not handled elsewhere in the `testAuthentication` method', async () => {
      nock(`${BASE_URL}/me`).get(/.*/).reply(500)

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError(
        'Credentials are invalid: 500 Internal Server Error'
      )
    })
  })
})
